import React, { useState, useEffect } from 'react';
import ProfilePicture from '@/components/ProfilePicture';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UserProfilePictureProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  allowEdit?: boolean;
  showFallbackIcon?: boolean;
  enableHover?: boolean;
  rounded?: 'full' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
}

const UserProfilePicture: React.FC<UserProfilePictureProps> = ({
  size = 'md',
  className = '',
  allowEdit = true,
  showFallbackIcon = true,
  enableHover = false,
  rounded = 'full',
  disabled = false
}) => {
  const { user, userProfile, isAuthenticated, refreshUserData } = useAuth();
  const [profileImageId, setProfileImageId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load user profile image on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && user && userProfile) {
      loadUserProfile();
    }
  }, [isAuthenticated, user, userProfile]);

  const loadUserProfile = async () => {
    if (!user || !userProfile) return;

    try {
      setIsLoading(true);

      // Check if userProfile already has the profile_image_id
      if (userProfile.profile_image_id) {
        setProfileImageId(userProfile.profile_image_id);
        return;
      }

      // Try to get the profile image ID from database
      if (userProfile.id) {
        const { data, error } = await window.ezsite.apis.tablePage('11725', {
          PageNo: 1,
          PageSize: 1,
          Filters: [{ name: 'ID', op: 'Equal', value: userProfile.id }]
        });

        if (error) {
          console.error('Error loading user profile:', error);
          return;
        }

        if (data && data.List && data.List.length > 0) {
          const profile = data.List[0];
          setProfileImageId(profile.profile_image_id || null);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpdate = async (newImageId: number | null) => {
    if (!user || !userProfile) return;

    try {
      setProfileImageId(newImageId);

      // Refresh user data to get the latest profile information
      await refreshUserData();

      toast({
        title: "Profile Updated",
        description: "Your profile picture has been updated successfully"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update your profile picture",
        variant: "destructive"
      });
    }
  };

  // Get user's full name
  const getFullName = () => {
    if (!user) return { firstName: '', lastName: '' };

    const nameParts = user.Name?.split(' ') || [];
    return {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || ''
    };
  };

  const { firstName, lastName } = getFullName();

  if (!isAuthenticated || !user) {
    return (
      <ProfilePicture
        size={size}
        className={className}
        showFallbackIcon={showFallbackIcon}
        enableHover={enableHover}
        rounded={rounded}
        disabled={true}
        allowEdit={false} />);


  }

  return (
    <ProfilePicture
      imageId={profileImageId}
      firstName={firstName}
      lastName={lastName}
      size={size}
      className={className}
      showFallbackIcon={showFallbackIcon}
      enableHover={enableHover}
      rounded={rounded}
      allowEdit={allowEdit}
      disabled={disabled || isLoading}
      onImageUpdate={handleImageUpdate}
      userId={user.ID}
      tableName="user_profiles"
      recordId={userProfile?.id}
      alt={`${firstName} ${lastName}`.trim() || user.Name || 'User profile picture'} />);


};

export default UserProfilePicture;