import { StatusService } from '../gen/seriuxmod/status/v1/status_service_pb.js';
import { websiteRpc as rpc } from './grpc/websiteRpc.js';

export const statusApi = {
    summary: signal => rpc(StatusService, 'getSummary', {}, { public: true, signal }),
    regions: signal => rpc(StatusService, 'listRegions', {}, { public: true, signal }).then(value => value.regions),
    region: (regionId, signal) => rpc(StatusService, 'getRegionSummary', { regionId }, { public: true, signal }),
    incidents: signal => rpc(StatusService, 'listIncidents', {}, { public: true, signal }).then(value => value.incidents)
};
export const statusAdminApi = {
    summary: signal => rpc(StatusService, 'getAdminSummary', {}, { signal }),
    scaleService: (serviceName, replicas) => rpc(StatusService, 'scaleService', { serviceName, replicas })
};
