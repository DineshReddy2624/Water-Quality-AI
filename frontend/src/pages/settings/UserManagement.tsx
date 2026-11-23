import React, { useEffect, useState } from 'react';
import { userService } from '../../services';
import { User } from '../../types';
import { Users, Shield, UserCheck, UserX, Trash2 } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.list();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleToggle = async (user: User) => {
    const nextRole = user.role === 'admin' ? 'standard' : 'admin';
    try {
      await userService.update(user.id, { role: nextRole });
      fetchUsers();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to update role');
    }
  };

  const handleStatusToggle = async (user: User) => {
    try {
      await userService.update(user.id, { is_active: !user.is_active });
      fetchUsers();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to update status');
    }
  };

  const handleDelete = async (user: User) => {
    if (window.confirm(`Delete user ${user.email}?`)) {
      try {
        await userService.delete(user.id);
        fetchUsers();
      } catch (e: any) {
        alert(e.response?.data?.detail || 'Failed to delete user');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          User & Access Control Management
        </h1>
        <p className="text-xs text-slate-500">
          Admin console to review registered environmental analysts, adjust role authorizations, and activate accounts.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs uppercase tracking-wider text-slate-500">
          Authorized Accounts ({users.length})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Analyst Name</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {u.full_name || 'Environmental Analyst'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {u.email}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                    }`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      u.is_active ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'
                    }`}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleRoleToggle(u)}
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-medium hover:bg-slate-100"
                        title="Toggle role between admin and standard"
                      >
                        Toggle Role
                      </button>
                      <button
                        onClick={() => handleStatusToggle(u)}
                        className="p-1 rounded text-slate-500 hover:text-slate-900"
                        title="Toggle Active Status"
                      >
                        {u.is_active ? <UserCheck className="h-4 w-4 text-emerald-600" /> : <UserX className="h-4 w-4 text-slate-400" />}
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
