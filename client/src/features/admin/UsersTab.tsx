import { useState, useEffect } from 'react';
import { Search, Users, MoreHorizontal } from 'lucide-react';
import {
  Input,
  Select,
  Badge,
  EmptyState,
  Alert,
  ConfirmDialog,
  DropdownMenu,
  DataTable,
  Pagination,
  Avatar,
  IconButton,
} from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';
import {
  fetchAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
  selectAdminUsers,
  selectAdminUsersStatus,
  selectAdminUsersError,
  selectAdminUsersPagination,
} from '@/store/slices/adminSlice';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import { roleBadgeVariant, capitalize } from './helpers';
import DeleteUserDialog from './DeleteUserDialog';
import type { AdminUser } from '@/types';

type FilterStatus = 'active' | 'deactivated' | 'deleted' | 'all';

export default function UsersTab() {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectAdminUsers);
  const status = useAppSelector(selectAdminUsersStatus);
  const error = useAppSelector(selectAdminUsersError);
  const pagination = useAppSelector(selectAdminUsersPagination);
  const currentUser = useAppSelector(selectCurrentUser);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<{ userId: string; action: 'deactivate' | 'activate' | 'demote'; userName: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  useEffect(() => {
    dispatch(fetchAdminUsers({ search: debouncedSearch || undefined, status: filterStatus, page, limit: 20 }));
  }, [dispatch, debouncedSearch, filterStatus, page]);

  function handleToggleStatus(user: AdminUser) {
    if (user.isActive) {
      setConfirmAction({ userId: user.id, action: 'deactivate', userName: user.fullName });
    } else {
      dispatch(updateAdminUserStatus({ userId: user.id, isActive: true }));
    }
  }

  function handleRoleChange(user: AdminUser, newRole: 'admin' | 'member') {
    if (newRole === 'member' && user.role === 'admin') {
      setConfirmAction({ userId: user.id, action: 'demote', userName: user.fullName });
    } else {
      dispatch(updateAdminUserRole({ userId: user.id, role: newRole }));
    }
  }

  function executeConfirmAction() {
    if (!confirmAction) return;
    if (confirmAction.action === 'deactivate') {
      dispatch(updateAdminUserStatus({ userId: confirmAction.userId, isActive: false }));
    } else if (confirmAction.action === 'demote') {
      dispatch(updateAdminUserRole({ userId: confirmAction.userId, role: 'member' }));
    }
    setConfirmAction(null);
  }

  const isCurrentUser = (user: AdminUser) => currentUser?.id === user.id;
  const isDeletedView = filterStatus === 'deleted';

  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: 'user',
      header: 'User',
      className: 'max-w-[280px]',
      noWrap: true,
      tooltipText: (row) => row.email,
      cell: (user) => (
        <div
          className="flex items-center gap-3"
          data-icod-id={`admin_users_user_cell_${user.id}`}>
          <Avatar name={user.fullName} size="sm" data-icod-id={`admin_users_avatar_${user.id}`} />
          <div className="flex flex-col min-w-0" data-icod-id={`admin_users_info_${user.id}`}>
            <div className="flex items-center gap-2" data-icod-id={`admin_users_name_row_${user.id}`}>
              <span className="font-medium text-foreground truncate" data-icod-id={`admin_users_name_${user.id}`}>
                {user.fullName}
                {user.isDeleted && (
                  <span
                    className="ml-1 text-muted-foreground font-normal"
                    data-icod-id="src_features_admin_userstab_tsx_ed4d">(deleted)</span>
                )}
              </span>
              {isCurrentUser(user) && (
                <Badge variant="neutral" size="sm" data-icod-id={`admin_users_you_badge_${user.id}`}>You</Badge>
              )}
              {user.isDeleted && (
                <Badge variant="status-gray" size="sm" data-icod-id={`admin_users_deleted_badge_${user.id}`}>Deleted</Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground truncate" data-icod-id={`admin_users_email_${user.id}`}>{user.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      noWrap: true,
      cell: (user) => (
        <div className="flex items-center gap-1.5" data-icod-id={`admin_users_orgrole_${user.id}`}>
          <Badge
            variant={user.role === 'guest' ? 'warning' : user.role === 'admin' ? 'status-blue' : 'neutral'}
            size="sm"
            data-icod-id="src_features_admin_userstab_tsx_2f90">
            {capitalize(user.role)}
          </Badge>
          {user.role === 'guest' && user.guestExpiresAt && (
            <span
              className="text-xs text-muted-foreground"
              data-icod-id="src_features_admin_userstab_tsx_967b">
              expires {formatRelativeTime(user.guestExpiresAt)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      noWrap: true,
      cell: (user) => {
        if (user.isDeleted) {
          return (
            <Badge variant="status-gray" data-icod-id={`admin_users_status_${user.id}`}>
              Deleted
            </Badge>
          );
        }
        return (
          <Badge
            variant={user.isActive ? 'status-green' : 'status-gray'}
            data-icod-id={`admin_users_status_${user.id}`}>
            {user.isActive ? 'Active' : 'Deactivated'}
          </Badge>
        );
      },
    },
    {
      key: 'lastLogin',
      header: 'Last login',
      noWrap: true,
      cell: (user) => (
        <span className="text-muted-foreground" data-icod-id={`admin_users_login_${user.id}`}>
          {formatRelativeTime(user.lastLoginAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      noWrap: true,
      cell: (user) => {
        // No actions for deleted users or current user
        if (isDeletedView || isCurrentUser(user)) return null;

        const menuItems: Array<{ type?: 'item' | 'divider'; label?: string; onClick?: () => void; danger?: boolean }> = [
          {
            label: user.role === 'admin' ? 'Make member' : 'Make admin',
            onClick: () => handleRoleChange(user, user.role === 'admin' ? 'member' : 'admin'),
          },
          {
            label: user.isActive ? 'Deactivate' : 'Reactivate',
            danger: user.isActive,
            onClick: () => handleToggleStatus(user),
          },
          { type: 'divider' },
          {
            label: 'Delete user',
            danger: true,
            onClick: () => setDeleteTarget(user),
          },
        ];

        return (
          <DropdownMenu
            trigger={
              <IconButton
                size="sm"
                tooltip="Actions"
                data-icod-id={`admin_users_actions_btn_${user.id}`}>
                <MoreHorizontal className="h-4 w-4" data-icod-id={`admin_users_actions_icon_${user.id}`} />
              </IconButton>
            }
            items={menuItems}
            data-icod-id={`admin_users_dropdown_${user.id}`} />
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4" data-icod-id="admin_users_tab_root">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4" data-icod-id="admin_users_filters">
        <div className="w-64" data-icod-id="admin_users_search_wrap">
          <Input
            leftIcon={<Search className="h-4 w-4" data-icod-id="admin_users_search_icon" />}
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            data-icod-id="admin_users_search_input" />
        </div>
        <Select
          className="w-40"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as FilterStatus); setPage(1); }}
          data-icod-id="admin_users_status_filter">
          <option value="all" data-icod-id="admin_users_filter_all">All Users</option>
          <option value="active" data-icod-id="admin_users_filter_active">Active</option>
          <option value="deactivated" data-icod-id="admin_users_filter_deactivated">Deactivated</option>
          <option value="deleted" data-icod-id="admin_users_filter_deleted">Deleted</option>
        </Select>
      </div>
      {error && <Alert variant="error" data-icod-id="admin_users_error">{error}</Alert>}
      {/* Table */}
      <DataTable
        columns={columns}
        rows={users}
        rowKey={(u) => u.id}
        loading={status === 'loading'}
        emptyState={
          <EmptyState
            icon={Users}
            title="No users found"
            description="Try adjusting your search or filters."
            data-icod-id="admin_users_empty" />
        }
        className="rounded-[var(--radius-lg)] border border-border bg-card"
        data-icod-id="admin_users_table" />
      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        pageSize={20}
        onPageChange={setPage}
        data-icod-id="admin_users_pagination" />
      {/* Confirmation dialog for destructive actions */}
      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction?.action === 'deactivate' ? 'Deactivate User' :
          confirmAction?.action === 'demote' ? 'Demote Admin' : 'Confirm'
        }
        description={
          confirmAction?.action === 'deactivate'
            ? `Are you sure you want to deactivate ${confirmAction?.userName}? They will lose access immediately.`
            : confirmAction?.action === 'demote'
            ? `Are you sure you want to remove admin privileges from ${confirmAction?.userName}?`
            : ''
        }
        confirmLabel={
          confirmAction?.action === 'deactivate' ? 'Deactivate' :
          confirmAction?.action === 'demote' ? 'Demote' : 'Confirm'
        }
        onConfirm={executeConfirmAction}
        data-icod-id="admin_users_confirm" />
      {/* Delete user dialog */}
      <DeleteUserDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        user={deleteTarget}
        onSuccess={() => {
          // Refresh the list after successful deletion
          dispatch(fetchAdminUsers({ search: debouncedSearch || undefined, status: filterStatus, page, limit: 20 }));
        }}
        data-icod-id="src_features_admin_userstab_tsx_32b4" />
    </div>
  );
}
