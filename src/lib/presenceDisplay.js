export const presenceLabels = { ONLINE: 'Online', IDLE: 'Abwesend', DO_NOT_DISTURB: 'Nicht stören', OFFLINE: 'Offline', INVISIBLE: 'Unsichtbar' };
export const surfaceLabels = { WEBSITE: 'Website', LAUNCHER: 'Launcher', CLIENT: 'Client' };
export function presenceDescription(presence) {
    if (!presence) return 'Status nicht verfügbar';
    const devices = (presence.surfaces || []).map(value => surfaceLabels[value]).filter(Boolean);
    return `${presenceLabels[presence.status] || 'Status unbekannt'}${devices.length ? ` · ${devices.join(', ')}` : ''}`;
}
export const socialTopicLabels = {
    'friend.request.created': 'Neue Freundschaftsanfrage', 'friend.request.accepted': 'Freundschaft angenommen',
    'friend.request.declined': 'Freundschaftsanfrage abgelehnt', 'friend.removed': 'Freundschaft beendet',
    'party.invite.created': 'Neue Party-Einladung', 'party.invite.accepted': 'Party-Einladung angenommen',
    'party.invite.declined': 'Party-Einladung abgelehnt', 'party.disbanded': 'Party aufgelöst',
    'party.member.kicked': 'Party-Mitglied entfernt', 'party.member.rank.changed': 'Party-Rang geändert',
    'clan.invite.created': 'Neue Clan-Einladung', 'clan.invite.accepted': 'Clan-Einladung angenommen',
    'clan.invite.declined': 'Clan-Einladung abgelehnt', 'clan.join-request.created': 'Neue Clan-Beitrittsanfrage',
    'clan.deleted': 'Clan aufgelöst', 'clan.member.kicked': 'Clan-Mitglied entfernt', 'clan.member.rank.changed': 'Clan-Rang geändert'
};
export const socialTopicTarget = topic => topic.startsWith('friend.') ? '/friends' : topic.startsWith('party.') ? '/party' : '/clans';
