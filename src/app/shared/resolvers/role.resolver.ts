// import { inject } from '@angular/core';
// import { ResolveFn } from '@angular/router';
// import { Role } from '../models/role.model';
// import { RolesService } from '../services/role.service';
// import { AuthService } from '../services/auth.service';
// import { switchMap, tap } from 'rxjs';

// export const roleResolver: ResolveFn<Role> = () => {
//   const roleService = inject(RolesService);
//   const authService = inject(AuthService);

//   return authService.currentUser.pipe(
//     switchMap(user => {
//         return roleService.getRole(user?.role);
//     }),
//     tap(role => {
//         authService.setUserRole(role);
//     })
//   );
// };
