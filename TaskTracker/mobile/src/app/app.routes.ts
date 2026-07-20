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
    path: 'home',
    loadComponent: () =>
      import('./home/home.page').then(
        (m) => m.HomePage
      ),
  },
  {
    path: 'teams',
    loadComponent: () => import('./pages/teams/teams.page').then( m => m.TeamsPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'team-board',
    loadComponent: () => import('./pages/team-board/team-board.page').then( m => m.TeamBoardPage)
  },
  {
  path: 'teams/:id',
  loadComponent: () =>
    import('./pages/team-board/team-board.page')
      .then(m => m.TeamBoardPage)
  },
  {
  path: 'teams/:id',
  loadComponent: () =>
    import(
      './pages/team-board/team-board.page'
    ).then(
      (module) =>
        module.TeamBoardPage
    )
},
  ];