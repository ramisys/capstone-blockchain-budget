import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      user: {
        addNewUser: 'Add New User',
        addNewUserSubtitle: 'Create a new user account and assign system permissions.',
        editUser: 'Edit User',
        editUserSubtitle: 'Update user account details and permissions.',
        createUser: 'Create User',
        creatingUser: 'Creating User...',
        updateUser: 'Update User',
        updatingUser: 'Updating User...',
        backToUsers: 'Back to User Management',
        personalInfo: 'Personal Information',
        personalInfoDesc: "Enter the user's personal details and primary email address.",
        security: 'Security',
        securityDesc: 'Set account authentication password and view security requirements.',
        accountSettings: 'Account Settings',
        accountSettingsDesc: 'Assign system permissions role and account operational status.',
      },
      buttons: {
        backToList: 'Back to User Management',
        cancel: 'Cancel',
        saving: 'Saving...',
        createUser: 'Create User',
      },
      form: {
        fullName: 'Full Name',
        fullNamePlaceholder: 'Enter full name',
        email: 'Email Address',
        emailPlaceholder: 'Enter email address',
        password: 'Password',
        passwordPlaceholder: 'Create a secure password',
        passwordHint: 'Must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number.',
        changePassword: 'Change Password',
        newPassword: 'New Password',
        role: 'Role',
        selectRole: 'Select a role',
        status: 'Status',
        selectStatus: 'Select a status',
      },
      role: {
        administrator: 'Administrator',
        treasurer: 'Treasurer',
        budgetofficer: 'Budget Officer',
        auditor: 'Auditor',
        'budget officer': 'Budget Officer',
      },
      status: {
        active: 'Active',
        inactive: 'Inactive',
      },
      validation: {
        fullNameRequired: 'Full Name is required',
        emailRequired: 'Email Address is required',
        emailInvalid: 'Please enter a valid email address',
        passwordRequired: 'Password is required',
        passwordMinLength: 'Password must be at least 8 characters',
        roleRequired: 'Role is required',
        statusRequired: 'Status is required',
      },
      errors: {
        accessDenied: 'Access Denied: Admin privileges required.',
        fetchUserFailed: 'Failed to fetch user details.',
        operationFailed: 'Operation failed. Please try again.',
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
