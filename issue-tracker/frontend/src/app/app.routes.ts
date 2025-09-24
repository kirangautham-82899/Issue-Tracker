import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/issues',
    pathMatch: 'full'
  },
  {
    path: 'issues',
    loadComponent: () => import('./components/issue-list/issue-list.component').then(m => m.IssueListComponent)
  },
  {
    path: 'issues/new',
    loadComponent: () => import('./components/issue-form/issue-form.component').then(m => m.IssueFormComponent)
  },
  {
    path: 'issues/:id/edit',
    loadComponent: () => import('./components/issue-form/issue-form.component').then(m => m.IssueFormComponent)
  },
  {
    path: '**',
    redirectTo: '/issues'
  }
];
