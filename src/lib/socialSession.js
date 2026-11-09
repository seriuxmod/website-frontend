export const emptySocialState = () => ({ userId: null, connection: 'signed-out', error: null, updatedAt: null,
    ownPresence: null, friends: [], requests: [], party: null, partyMembers: [], partyActivities: [],
    clan: null, clanMembers: [], clanRanks: [], clanInvites: [], joinRequests: [], people: {},
    notifications: [], unreadCount: null, notificationPage: 0, notificationPages: 0 });
const optional = promise => promise.catch(error => { if (error.code === 5 || error.status === 404) return null; throw error; });

// One account-bound central Watch per provider, never one per page/domain.
// Events invalidate; every Ready and periodic reconciliation reloads RPC state.
export class SocialSession {
    constructor({ api, users, watch, ensureSession, tokenExpiresAt, onState = () => {} }) {
        Object.assign(this, { api, users, watch, ensureSession, tokenExpiresAt, onState });
        this.state = emptySocialState(); this.epoch = 0; this.dirty = 0;
    }
    emit(patch) { this.state = { ...this.state, ...patch }; this.onState(this.state); }
    select(userId, sessionId) {
        if (userId === this.state.userId && sessionId === this.sessionId) return;
        this.stop(); this.sessionId = sessionId;
        this.state = { ...emptySocialState(), userId }; this.onState(this.state);
        if (!userId) return;
        this.halted = false;
        void this.connect(this.epoch);
        this.heartbeat = setInterval(() => {
            if (this.state.connection !== 'connected') return;
            const epoch = this.epoch;
            void this.api.presence.heartbeat(this.attempt?.signal).then(() => this.refresh())
                .catch(error => { if (epoch === this.epoch && error.name !== 'AbortError') this.failure(error); });
        }, 60_000);
    }
    async connect(epoch) {
        const attempt = new AbortController(); this.attempt?.abort(); this.attempt = attempt;
        this.loading = null; this.dirty = 0;
        const current = () => epoch === this.epoch && this.attempt === attempt && !attempt.signal.aborted && !this.halted;
        this.emit({ connection: this.state.updatedAt ? 'reconnecting' : 'connecting' });
        let readyTimer = setTimeout(() => attempt.abort(), 20_000);
        try {
            const canceled = new Promise((_, reject) => attempt.signal.addEventListener('abort',
                () => reject(Object.assign(new Error('Social connection canceled or timed out'), { code: 4 })), { once: true }));
            const session = await Promise.race([this.ensureSession(), canceled]);
            if (!current()) return;
            if (!session || session.playerId !== this.state.userId) throw Object.assign(new Error('Website-Sitzung beendet.'), { code: 16 });
            for await (const event of this.watch(attempt.signal)) {
                if (!current()) return;
                const { case: kind, value } = event.payload;
                if (kind === 'ready') {
                    clearTimeout(readyTimer); readyTimer = null;
                    if (value.userId !== this.state.userId) throw Object.assign(new Error('Realtime-Identität stimmt nicht überein.'), { code: 16 });
                    this.emit({ connection: 'synchronizing', error: null });
                    await this.api.presence.heartbeat(attempt.signal);
                    if (!current()) return;
                    await this.refresh();
                    if (!current()) return;
                    this.failures = 0;
                    this.emit({ connection: 'connected', error: null });
                    const expires = this.tokenExpiresAt();
                    clearTimeout(this.renewal);
                    if (Number.isFinite(expires)) this.renewal = setTimeout(() => {
                        if (current()) { attempt.abort(); void this.connect(epoch); }
                    }, Math.max(1000, expires - Date.now() - 120_000));
                } else if (kind === 'accountLocked' || kind === 'accountDeactivated') {
                    throw Object.assign(new Error('Account-Zugriff beendet.'), { code: 7 });
                } else if (kind === 'socialEvent' || kind === 'playerPermissionsChanged' || kind === 'permissionGroupChanged') {
                    await this.refresh();
                }
            }
            if (current()) throw Object.assign(new Error('Realtime-Verbindung unterbrochen.'), { code: 14 });
        } catch (error) {
            if (!current()) {
                // Ready timeout aborted this same attempt, not a replacement.
                if (epoch !== this.epoch || this.attempt !== attempt || this.halted) return;
            }
            if (error.code === 16 || error.code === 7) { this.terminate(error); return; }
            this.emit({ connection: 'reconnecting', error: 'Social-Verbindung unterbrochen. Wiederverbindung läuft.' });
            const delay = Math.min(30_000, 1000 * 2 ** Math.min(this.failures || 0, 5));
            this.failures = (this.failures || 0) + 1;
            clearTimeout(this.retry);
            this.retry = setTimeout(() => { if (epoch === this.epoch && !this.halted) void this.connect(epoch); }, delay);
        } finally { clearTimeout(readyTimer); }
    }
    refresh() {
        if (!this.state.userId || this.halted || !this.attempt || this.attempt.signal.aborted) return Promise.resolve();
        ++this.dirty;
        if (this.loading) return this.loading;
        const epoch = this.epoch;
        const operation = (async () => {
            do {
                this.dirty = 0;
                const attempt = this.attempt, page = this.state.notificationPage;
                const data = await this.load(attempt.signal, page);
                if (epoch !== this.epoch || this.halted) return;
                if (attempt !== this.attempt || attempt.signal.aborted || page !== this.state.notificationPage) { this.dirty = 1; continue; }
                this.emit({ ...data, updatedAt: new Date().toISOString(), error: null });
            } while (this.dirty);
        })();
        this.loading = operation;
        void operation.finally(() => { if (this.loading === operation) this.loading = null; }).catch(() => {});
        return operation;
    }
    async load(signal, page) {
        const api = this.api, userId = this.state.userId;
        const [friends, requests, ownPresence, partyOverview, clan, clanInvites, inbox] = await Promise.all([
            api.friends.list(signal), api.friends.requests(signal), api.presence.mine(signal), optional(api.parties.overview(signal)),
            optional(api.clans.mine(signal)), api.clans.invites(signal), api.notifications.list(page, 25, false, signal)
        ]);
        const [clanMembers, clanRanks] = await Promise.all([clan ? api.clans.members(clan.id, signal) : [], clan ? api.clans.ranks(clan.id, signal) : []]);
        const ownRank = clanRanks.find(rank => rank.key === clanMembers.find(member => member.userId === userId)?.rankKey);
        const joinRequests = ownRank?.canInvite ? await api.clans.requests(clan.id, signal) : [];
        const partyMembers = partyOverview?.members || [];
        const ids = [...new Set([userId, ...friends.map(value => value.friendUserId), ...requests.map(value => value.senderUserId),
            ...partyMembers.map(value => value.userId), ...clanMembers.map(value => value.userId), ...clanInvites.map(value => value.senderUserId), ...joinRequests.map(value => value.senderUserId)])];
        const people = {};
        for (let start = 0; start < ids.length; start += 20) {
            const batch = ids.slice(start, start + 20);
            const profiles = await this.users.batch(batch, signal);
            await Promise.all(batch.map(async id => {
                const presence = await api.presence.public(id, 28, signal).catch(error => { if (error.name === 'AbortError') throw error; return null; });
                people[id] = { username: profiles.find(value => value.playerId === id)?.username || id, presence };
            }));
        }
        return { friends, requests, ownPresence, party: partyOverview?.party || null, partyMembers,
            partyActivities: partyOverview?.memberActivities || [], clan, clanMembers, clanRanks, clanInvites, joinRequests, people,
            notifications: inbox.items, unreadCount: inbox.unreadCount, notificationPages: inbox.totalPages };
    }
    async mutate(action) {
        if (this.state.connection !== 'connected' || this.halted) throw new Error('Social ist nicht verbunden.');
        const epoch = this.epoch;
        let result;
        try { result = await action(this.api); }
        catch (error) { if (epoch === this.epoch && error.code === 16) this.terminate(error); throw error; }
        if (epoch !== this.epoch) throw new Error('Account gewechselt.');
        await this.refresh();
        if (epoch !== this.epoch) throw new Error('Account gewechselt.');
        return result;
    }
    failure(error) {
        if (error.code === 16) this.terminate(error);
        else this.emit({ error: 'Social-Zustand nicht verfügbar. Bitte erneut versuchen.' });
    }
    terminate(error) {
        const userId = this.state.userId;
        this.stop(); this.halted = true;
        this.state = { ...emptySocialState(), userId, connection: error.code === 7 ? 'forbidden' : 'unauthenticated', error: error.message };
        this.onState(this.state);
    }
    page(page) {
        if (!Number.isInteger(page) || page < 0 || page > 10000) throw new Error('Ungültige Seite.');
        this.emit({ notificationPage: page }); return this.refresh();
    }
    stop() {
        ++this.epoch; this.attempt?.abort(); this.attempt = null;
        clearInterval(this.heartbeat); clearTimeout(this.retry); clearTimeout(this.renewal);
        this.loading = null; this.dirty = 0; this.failures = 0;
    }
}
