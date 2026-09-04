import React, { useState } from 'react';
import { useUsers, useUpdateUserRole } from '../../hooks/useUsers';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Badge } from '../../components/ui/Badge';
import { User, UserRole } from '../../types';
import { formatDate } from '../../utils/formatters';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

export const UsersPage: React.FC = () => {
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useUsers({
    role: roleFilter === 'ALL' ? undefined : roleFilter,
    search: search || undefined,
    page,
    limit: 10,
  });

  const updateRoleMutation = useUpdateUserRole();

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateRoleMutation.mutateAsync({ id: userId, role: newRole });
      toast.success('User role updated.');
    } catch {
      toast.error('Failed to update user role.');
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User Identity',
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {u.name.charAt(0)}
          </div>
          <div>
            <span className="font-bold text-xs text-slate-900 block">{u.name}</span>
            <span className="text-[11px] text-slate-500 block">{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (u) => {
        return (
          <select
            value={u.role}
            onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
            className="text-xs font-bold rounded-lg border border-slate-200 px-2 py-1 bg-white focus:outline-none cursor-pointer"
          >
            <option value="CITIZEN">Citizen</option>
            <option value="OFFICER">Municipal Officer</option>
            <option value="FIELD_WORKER">Field Worker</option>
            <option value="ADMIN">System Admin</option>
          </select>
        );
      },
    },
    {
      key: 'phone',
      header: 'Contact',
      render: (u) => <span className="text-xs text-slate-600">{u.phone || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (
        <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'} size="sm" dot>
          {u.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Registered',
      render: (u) => <span className="text-xs text-slate-500">{formatDate(u.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Administration', href: '/admin' }, { label: 'User Management' }]} />
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
          Civic Identity & RBAC Management
        </h1>
        <p className="text-xs text-slate-500">
          Manage platform accounts across Citizen, Officer, Field Worker, and Admin personas.
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none w-56"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none cursor-pointer"
        >
          <option value="ALL">All Roles</option>
          <option value="CITIZEN">Citizens</option>
          <option value="OFFICER">Municipal Officers</option>
          <option value="FIELD_WORKER">Field Workers</option>
          <option value="ADMIN">System Admins</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={result?.data || []}
        keyExtractor={(u) => u.id}
        isLoading={isLoading}
        pagination={
          result
            ? {
                currentPage: result.page,
                totalPages: result.totalPages,
                onPageChange: setPage,
                totalItems: result.total,
                pageSize: result.limit,
              }
            : undefined
        }
      />
    </div>
  );
};
