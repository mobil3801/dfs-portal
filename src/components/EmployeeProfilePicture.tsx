import React, { useState, useEffect } from 'react';
import ProfilePicture from '@/components/ProfilePicture';
import { useToast } from '@/hooks/use-toast';

interface EmployeeProfilePictureProps {
  employeeId: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  allowEdit?: boolean;
  showFallbackIcon?: boolean;
  enableHover?: boolean;
  rounded?: 'full' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  onImageUpdate?: (imageId: number | null) => void;
}

const EmployeeProfilePicture: React.FC<EmployeeProfilePictureProps> = ({
  employeeId,
  size = 'md',
  className = '',
  allowEdit = true,
  showFallbackIcon = true,
  enableHover = false,
  rounded = 'full',
  disabled = false,
  onImageUpdate
}) => {
  const [employee, setEmployee] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load employee data on mount and when employeeId changes
  useEffect(() => {
    if (employeeId) {
      loadEmployeeData();
    }
  }, [employeeId]);

  const loadEmployeeData = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await window.ezsite.apis.tablePage('11727', {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: 'ID', op: 'Equal', value: employeeId }]
      });

      if (error) {
        console.error('Error loading employee:', error);
        toast({
          title: "Error",
          description: "Failed to load employee data",
          variant: "destructive"
        });
        return;
      }

      if (data && data.List && data.List.length > 0) {
        setEmployee(data.List[0]);
      }
    } catch (error) {
      console.error('Error loading employee:', error);
      toast({
        title: "Error",
        description: "Failed to load employee data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpdate = async (newImageId: number | null) => {
    try {
      // Update the employee record with the new image ID
      setEmployee((prev: any) => ({
        ...prev,
        profile_image_id: newImageId
      }));

      // Reload employee data to get the latest information
      await loadEmployeeData();

      // Call parent callback if provided
      if (onImageUpdate) {
        onImageUpdate(newImageId);
      }

      toast({
        title: "Profile Updated",
        description: "Employee profile picture has been updated successfully"
      });
    } catch (error) {
      console.error('Error updating employee profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update employee profile picture",
        variant: "destructive"
      });
    }
  };

  if (!employee) {
    return (
      <ProfilePicture
        size={size}
        className={className}
        showFallbackIcon={showFallbackIcon}
        enableHover={enableHover}
        rounded={rounded}
        disabled={true}
        allowEdit={false}
        showLoadingState={isLoading} />);


  }

  return (
    <ProfilePicture
      imageId={employee.profile_image_id}
      firstName={employee.first_name}
      lastName={employee.last_name}
      size={size}
      className={className}
      showFallbackIcon={showFallbackIcon}
      enableHover={enableHover}
      rounded={rounded}
      allowEdit={allowEdit}
      disabled={disabled || isLoading}
      onImageUpdate={handleImageUpdate}
      employeeId={employeeId}
      tableName="employees"
      recordId={employeeId}
      alt={`${employee.first_name} ${employee.last_name}`.trim() || 'Employee profile picture'} />);


};

export default EmployeeProfilePicture;