import { useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';
import SettingsLayout from '@/components/layout/SettingsLayout';
import { AppearanceSection, UsersSection } from '@/features/settings';

interface SettingsPageProps {
  section: 'appearance' | 'users';
}

export default function SettingsPage({ section }: SettingsPageProps) {
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = user?.role === 'admin';

  return (
    <SettingsLayout data-icod-id="settings_page">
      {section === 'appearance' && <AppearanceSection data-icod-id="settings_appearance" />}
      {section === 'users' && isAdmin && <UsersSection data-icod-id="settings_users" />}
    </SettingsLayout>
  );
}
