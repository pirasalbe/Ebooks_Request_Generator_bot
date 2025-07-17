import { Admin } from '../../model/admins/admin';
import { FilesService } from '../files/filesService';

export class AdminService {
  constructor(private filesService: FilesService, private admins: number[]) {
    if (admins === undefined) {
      throw new Error('Please specify the admins.');
    }
  }

  isSuperAdmin(type: 'private' | 'group' | 'supergroup', id: number): boolean {
    if (type !== 'private') {
      return false;
    }

    return this.admins.includes(id);
  }

  isAdmin(type: 'private' | 'group' | 'supergroup', id: number): boolean {
    if (type !== 'private') {
      return false;
    }

    const admins: Admin[] = this.filesService.readFile('admins', []);

    return (
      this.isSuperAdmin(type, id) || admins.map(({ id }) => id).includes(id)
    );
  }

  addAdmin(adminId: number): void {
    const admins: Admin[] = this.filesService.readFile('admins', []);

    if (!admins.map(({ id }) => id).includes(adminId)) {
      admins.push({ id: adminId });
      this.filesService.writeFile('admins', admins);
    }
  }

  removeAdmin(adminId: number): void {
    const admins: Admin[] = this.filesService.readFile('admins', []);
    const index = admins.findIndex(({ id }) => id === adminId);

    if (index > -1) {
      admins.splice(index, 1);
      this.filesService.writeFile('admins', admins);
    }
  }
}
