import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then(
        (m) => m.LoginPage
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.page').then(
        (m) => m.RegisterPage
      ),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.page').then(
        (m) => m.HomePage
      ),
  },
  {
    path: 'teams',
    loadComponent: () =>
      import('./pages/teams/teams.page').then(
        (m) => m.TeamsPage
      ),
  },
   {
    path: 'teams/:id',
    loadComponent: () =>
      import('./pages/team-board/team-board.page')
    .then(
        (m) => m.TeamBoardPage
      ),
  },
  {
    path: 'teams/:id/list',
    loadComponent: () =>
      import('./pages/team-task-list/team-task-list.page').then(
        (m) => m.TeamTaskListPage
      ),
  },
  {
    path: 'teams/:teamId/tasks/:taskId',
    loadComponent: () =>
      import('./pages/task-detail/task-detail.page').then(
        (m) => m.TaskDetailPage
      ),
  },
  {
    path: 'tasks',
    loadComponent: () =>
      import('./pages/tasks/tasks.page').then(
        (m) => m.TasksPage
      ),
  },
  {
  path: 'teams/:id/summary',
  loadComponent: () =>
    import('./pages/team-summary/team-summary.page')
      .then(m => m.TeamSummaryPage)
},
  {
  path: 'teams/:id/calendar',
  loadComponent: () =>
    import('./pages/team-calendar/team-calendar.page').then(
      m => m.TeamCalendarPage
    )
},
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then( m => m.DashboardPage)
  },
  {
  path: 'dashboard',
  loadComponent: () =>
    import('./pages/dashboard/dashboard.page').then(
      m => m.DashboardPage
    )
},
];