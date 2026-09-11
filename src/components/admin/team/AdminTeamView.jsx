import { Navigate } from 'react-router-dom';
import { getAuthenticatedUser, hasAnyPermission, isTeamAdministrator } from '../../../lib/auth';
import TeamOverviewView from './TeamOverviewView';
import TeamCalendarView from './TeamCalendarView';
import TeamActivityView from './TeamActivityView';
import TeamTodosView from './TeamTodosView';
import TeamNotesView from './TeamNotesView';

const VIEWS = {
    team: TeamOverviewView,
    'team-calendar': TeamCalendarView,
    'team-activity': TeamActivityView,
    'team-todos': TeamTodosView,
    'team-notes': TeamNotesView
};

const REQUIRED_PERMISSIONS = {
    team: ['team.overview.read'],
    'team-calendar': ['team.calendar.read'],
    'team-activity': ['team.activity.read'],
    'team-todos': ['team.todos.read'],
    'team-notes': ['team.notes.read']
};

const MODULE_ROUTES = {
    team: '/admin/team',
    'team-calendar': '/admin/team/calendar',
    'team-activity': '/admin/team/activity',
    'team-todos': '/admin/team/todos',
    'team-notes': '/admin/team/notes'
};

export default function AdminTeamView({ module }) {
    const user = getAuthenticatedUser();
    const View = VIEWS[module];
    if (!isTeamAdministrator(user)) return <Navigate replace to="/admin" />;
    const fallback = Object.keys(VIEWS).find((candidate) => hasAnyPermission(user, ...REQUIRED_PERMISSIONS[candidate]));
    if (!View || !hasAnyPermission(user, ...REQUIRED_PERMISSIONS[module])) {
        return <Navigate replace to={fallback ? MODULE_ROUTES[fallback] : '/admin'} />;
    }
    return <View user={user} />;
}
