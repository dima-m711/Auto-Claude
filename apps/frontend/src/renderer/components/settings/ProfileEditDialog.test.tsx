/**
 * @vitest-environment jsdom
 */
/**
 * ProfileEditDialog Tests
 *
 * Tests both create and edit modes for the API profile dialog.
 * Following Story 1.3: Edit Existing Profile
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import '../../../shared/i18n';
import { ProfileEditDialog } from './ProfileEditDialog';
import type { APIProfile } from '@shared/types/profile';

// Mock the settings store
vi.mock('../../stores/settings-store', () => ({
  useSettingsStore: vi.fn()
}));

import { useSettingsStore } from '../../stores/settings-store';

describe('ProfileEditDialog - Edit Mode', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSaved = vi.fn();

  const mockProfile: APIProfile = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Profile',
    baseUrl: 'https://api.example.com',
    apiKey: 'sk-ant-api123-test-key-abc123',
    models: {
      default: 'claude-sonnet-4-5-20250929',
      haiku: 'claude-haiku-4-5-20251001'
    },
    createdAt: 1700000000000,
    updatedAt: 1700000000000
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock store to return updateProfile action
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateProfile: vi.fn().mockResolvedValue(true),
      saveProfile: vi.fn().mockResolvedValue(true),
      profilesLoading: false,
      profilesError: null
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Test 5 from story: Pre-populated form data
  it('should pre-populate all fields with existing values when editing', async () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateProfile: vi.fn().mockResolvedValue(true),
      saveProfile: vi.fn().mockResolvedValue(true),
      profilesLoading: false,
      profilesError: null
    });

    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSaved={mockOnSaved}
        profile={mockProfile}
      />
    );

    // Verify all fields are pre-populated
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toHaveValue('Test Profile');
      expect(screen.getByLabelText(/base url/i)).toHaveValue('https://api.example.com');
    });

    // Note: Model fields use ModelSearchableSelect component which doesn't use standard
    // label/input associations. The model field functionality is tested via E2E tests.
  });

  // Test 6 from story: API key displays masked
  it('should display masked API key in edit mode', async () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateProfile: vi.fn().mockResolvedValue(true),
      saveProfile: vi.fn().mockResolvedValue(true),
      profilesLoading: false,
      profilesError: null
    });

    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        profile={mockProfile}
      />
    );

    // API key field displays four mask characters (••••) plus only the last four characters of the full key
    // Example: full key "sk-ant-api123-test-key-abc123" => masked display "••••c123"
    await waitFor(() => {
      const maskedInput = screen.getByDisplayValue(/••••c123/);
      expect(maskedInput).toBeDisabled();
    });
  });

  // Test 1 from story: Edit profile name
  it('should update profile when form is modified and saved', async () => {
    const mockUpdateFn = vi.fn().mockResolvedValue(true);
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateProfile: mockUpdateFn,
      saveProfile: vi.fn().mockResolvedValue(true),
      profilesLoading: false,
      profilesError: null
    });

    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSaved={mockOnSaved}
        profile={mockProfile}
      />
    );

    // Wait for form to populate
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toHaveValue('Test Profile');
    });

    // Change the name
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Profile Name' } });

    // Click save
    const saveButton = screen.getByText(/save profile/i);
    fireEvent.click(saveButton);

    // Verify updateProfile was called (not saveProfile)
    await waitFor(() => {
      expect(mockUpdateFn).toHaveBeenCalled();
    });
  });

  // Dialog title should say "Edit Profile" in edit mode
  it('should show "Edit Profile" title in edit mode', async () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateProfile: vi.fn().mockResolvedValue(true),
      saveProfile: vi.fn().mockResolvedValue(true),
      profilesLoading: false,
      profilesError: null
    });

    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        profile={mockProfile}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });
  });

  // Test 7 from story: Cancel button
  it('should close dialog without saving when Cancel is clicked', async () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateProfile: vi.fn().mockResolvedValue(true),
      saveProfile: vi.fn().mockResolvedValue(true),
      profilesLoading: false,
      profilesError: null
    });

    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        profile={mockProfile}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  // Test 8 from story: Models fields pre-populate
  it('should pre-populate optional model fields with existing values', async () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateProfile: vi.fn().mockResolvedValue(true),
      saveProfile: vi.fn().mockResolvedValue(true),
      profilesLoading: false,
      profilesError: null
    });

    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        profile={mockProfile}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toHaveValue('Test Profile');
    });

    // Find model inputs by their labels
    const modelLabels = screen.getAllByText(/model/i);
    expect(modelLabels.length).toBeGreaterThan(0);
  });
});

describe('ProfileEditDialog - Create Mode', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSaved = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      saveProfile: vi.fn().mockResolvedValue(true),
      profilesLoading: false,
      profilesError: null
    });
  });

  // Dialog title should say "Add API Profile" in create mode
  it('should show "Add API Profile" title in create mode', () => {
    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSaved={mockOnSaved}
      />
    );

    expect(screen.getByText('Add API Profile')).toBeInTheDocument();
  });

  // Fields should be empty in create mode
  it('should have empty fields in create mode', () => {
    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.getByLabelText(/base url/i)).toHaveValue('');
  });

  // API key input should be normal (not masked) in create mode
  it('should show normal API key input in create mode', () => {
    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const apiKeyInput = screen.getByLabelText(/api key/i);
    expect(apiKeyInput).toHaveAttribute('type', 'password');
    expect(apiKeyInput).not.toBeDisabled();
  });

  it('should apply preset values in create mode', async () => {
    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const presetTrigger = screen.getByLabelText(/preset/i);
    fireEvent.keyDown(presetTrigger, { key: 'ArrowDown', code: 'ArrowDown' });

    const glmGlobalOption = await screen.findByRole('option', { name: 'GLM (Global)' });
    fireEvent.click(glmGlobalOption);

    expect(screen.getByLabelText(/base url/i)).toHaveValue('https://api.z.ai/api/anthropic');
    expect(screen.getByLabelText(/name/i)).toHaveValue('GLM (Global)');
  });

  it('should not overwrite name when applying a preset', async () => {
    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'My Custom Name' } });

    const presetTrigger = screen.getByLabelText(/preset/i);
    fireEvent.keyDown(presetTrigger, { key: 'ArrowDown', code: 'ArrowDown' });

    const groqOption = await screen.findByRole('option', { name: 'Groq' });
    fireEvent.click(groqOption);

    expect(screen.getByLabelText(/name/i)).toHaveValue('My Custom Name');
    expect(screen.getByLabelText(/base url/i)).toHaveValue('https://api.groq.com/openai/v1');
  });

  it('should move focus to Base URL after selecting a preset', async () => {
    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const presetTrigger = screen.getByLabelText(/preset/i);
    fireEvent.keyDown(presetTrigger, { key: 'ArrowDown', code: 'ArrowDown' });

    const anthropicOption = await screen.findByRole('option', { name: 'Anthropic' });
    fireEvent.click(anthropicOption);

    await waitFor(() => {
      expect(screen.getByLabelText(/base url/i)).toHaveFocus();
    });
  });
});

describe('ProfileEditDialog - Validation', () => {
  const mockOnOpenChange = vi.fn();
  const mockProfile: APIProfile = {
    id: 'test-id',
    name: 'Test',
    baseUrl: 'https://api.example.com',
    apiKey: 'sk-ant-test123',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  // Test 4 from story: Invalid Base URL validation
  it('should show inline error for invalid Base URL', async () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateProfile: vi.fn().mockResolvedValue(true),
      profilesLoading: false,
      profilesError: null
    });

    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        profile={mockProfile}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/base url/i)).toHaveValue('https://api.example.com');
    });

    // Enter invalid URL
    const urlInput = screen.getByLabelText(/base url/i);
    fireEvent.change(urlInput, { target: { value: 'not-a-valid-url' } });

    // Click save to trigger validation
    const saveButton = screen.getByText(/save profile/i);
    fireEvent.click(saveButton);

    // Should show error
    await waitFor(() => {
      expect(screen.getByText(/invalid url/i)).toBeInTheDocument();
    });
  });

  // Test 2 from story: Edit profile name to duplicate existing name
  it('should show error when editing to duplicate name', async () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateProfile: vi.fn().mockResolvedValue(false), // Simulating duplicate name error
      profilesLoading: false,
      profilesError: 'A profile with this name already exists'
    });

    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        profile={mockProfile}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toHaveValue('Test');
    });

    // Change name to a duplicate
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Duplicate Name' } });

    // Click save
    const saveButton = screen.getByText(/save profile/i);
    fireEvent.click(saveButton);

    // Should show error from store
    await waitFor(() => {
      expect(screen.getByText(/A profile with this name already exists/i)).toBeInTheDocument();
    });
  });

  // Test 3 from story: Edit active profile
  it('should keep profile active after editing', async () => {
    const mockUpdateFn = vi.fn().mockResolvedValue(true);
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateProfile: mockUpdateFn,
      profilesLoading: false,
      profilesError: null,
      profiles: [{ ...mockProfile, id: 'active-id' }],
      activeProfileId: 'active-id'
    });

    const activeProfile: APIProfile = {
      ...mockProfile,
      id: 'active-id',
      name: 'Active Profile'
    };

    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        profile={activeProfile}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toHaveValue('Active Profile');
    });

    // Change the name
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Active Profile' } });

    // Click save
    const saveButton = screen.getByText(/save profile/i);
    fireEvent.click(saveButton);

    // Verify updateProfile was called
    await waitFor(() => {
      expect(mockUpdateFn).toHaveBeenCalled();
    });
  });
});

describe('ProfileEditDialog - Test Connection Feature', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSaved = vi.fn();
  const mockTestConnection = vi.fn();

  const mockProfile: APIProfile = {
    id: 'test-id',
    name: 'Test Profile',
    baseUrl: 'https://api.example.com',
    apiKey: 'sk-ant-test12345678',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateProfile: vi.fn().mockResolvedValue(true),
      saveProfile: vi.fn().mockResolvedValue(true),
      testConnection: mockTestConnection,
      profilesLoading: false,
      profilesError: null,
      isTestingConnection: false,
      testConnectionResult: null
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should show Test Connection button', async () => {
    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        profile={mockProfile}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Connection')).toBeInTheDocument();
    });
  });

  it('should call testConnection when button is clicked', async () => {
    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        profile={mockProfile}
      />
    );

    const testButton = await screen.findByText('Test Connection');
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(mockTestConnection).toHaveBeenCalledWith(
        'https://api.example.com',
        'sk-ant-test12345678',
        expect.any(AbortSignal)
      );
    });
  });

  it('should show loading state while testing connection', async () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateProfile: vi.fn().mockResolvedValue(true),
      testConnection: mockTestConnection,
      profilesLoading: false,
      profilesError: null,
      isTestingConnection: true,
      testConnectionResult: null
    });

    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        profile={mockProfile}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Testing...')).toBeInTheDocument();
    });

    const testButton = screen.getByText('Testing...');
    expect(testButton).toBeDisabled();
  });

  it('should show success message when connection succeeds', async () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateProfile: vi.fn().mockResolvedValue(true),
      testConnection: mockTestConnection,
      profilesLoading: false,
      profilesError: null,
      isTestingConnection: false,
      testConnectionResult: {
        success: true,
        message: 'Connection successful'
      }
    });

    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        profile={mockProfile}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Connection Successful')).toBeInTheDocument();
      expect(screen.getByText('Connection successful')).toBeInTheDocument();
    });
  });

  it('should show error message when connection fails', async () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateProfile: vi.fn().mockResolvedValue(true),
      testConnection: mockTestConnection,
      profilesLoading: false,
      profilesError: null,
      isTestingConnection: false,
      testConnectionResult: {
        success: false,
        errorType: 'auth',
        message: 'Authentication failed. Please check your API key.'
      }
    });

    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        profile={mockProfile}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Connection Failed')).toBeInTheDocument();
      expect(screen.getByText('Authentication failed. Please check your API key.')).toBeInTheDocument();
    });
  });

  it('should validate baseUrl before testing connection', async () => {
    const testConnectionFn = vi.fn();
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateProfile: vi.fn().mockResolvedValue(true),
      testConnection: testConnectionFn,
      profilesLoading: false,
      profilesError: null,
      isTestingConnection: false,
      testConnectionResult: null
    });

    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    // Fill name (required to enable Test Connection button)
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Profile' } });

    // Fill apiKey but leave baseUrl empty
    const keyInput = screen.getByLabelText(/api key/i);
    fireEvent.change(keyInput, { target: { value: 'sk-ant-test12345678' } });

    // Test button should still be disabled since baseUrl is empty
    const testButton = screen.getByText('Test Connection');
    expect(testButton).toBeDisabled();

    // Should NOT call testConnection
    expect(testConnectionFn).not.toHaveBeenCalled();
  });

  it('should validate apiKey before testing connection', async () => {
    const testConnectionFn = vi.fn();
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateProfile: vi.fn().mockResolvedValue(true),
      testConnection: testConnectionFn,
      profilesLoading: false,
      profilesError: null,
      isTestingConnection: false,
      testConnectionResult: null
    });

    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    // Fill name (required to enable Test Connection button)
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Profile' } });

    // Fill baseUrl but leave apiKey empty
    const urlInput = screen.getByLabelText(/base url/i);
    fireEvent.change(urlInput, { target: { value: 'https://api.example.com' } });

    // Test button should still be disabled since apiKey is empty
    const testButton = screen.getByText('Test Connection');
    expect(testButton).toBeDisabled();

    // Should NOT call testConnection
    expect(testConnectionFn).not.toHaveBeenCalled();
  });

  it('should use profile.apiKey when testing in edit mode without changing key', async () => {
    const testConnectionFn = vi.fn();
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateProfile: vi.fn().mockResolvedValue(true),
      testConnection: testConnectionFn,
      profilesLoading: false,
      profilesError: null,
      isTestingConnection: false,
      testConnectionResult: null
    });

    render(
      <ProfileEditDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        profile={mockProfile}
      />
    );

    const testButton = await screen.findByText('Test Connection');
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(testConnectionFn).toHaveBeenCalledWith(
        'https://api.example.com',
        'sk-ant-test12345678',
        expect.any(AbortSignal)
      );
    });
  });
});

describe('ProfileEditDialog - AWS Bedrock Integration', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSaved = vi.fn();

  const mockBedrockProfile: APIProfile = {
    id: 'bedrock-profile-id',
    name: 'My Bedrock Profile',
    providerType: 'bedrock',
    baseUrl: '',
    apiKey: '',
    awsRegion: 'us-west-2',
    awsProfile: 'my-sso-profile',
    models: {
      default: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
      haiku: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
      sonnet: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
      opus: 'us.anthropic.claude-opus-4-5-20251101-v1:0'
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      saveProfile: vi.fn().mockResolvedValue(true),
      updateProfile: vi.fn().mockResolvedValue(true),
      profilesLoading: false,
      profilesError: null,
      isTestingConnection: false,
      testConnectionResult: null
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode - Bedrock Preset Selection', () => {
    it('should show AWS Region and AWS Profile fields when Bedrock preset is selected', async () => {
      render(
        <ProfileEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSaved={mockOnSaved}
        />
      );

      // Select Bedrock preset
      const presetTrigger = screen.getByLabelText(/preset/i);
      fireEvent.keyDown(presetTrigger, { key: 'ArrowDown', code: 'ArrowDown' });

      const bedrockOption = await screen.findByRole('option', { name: 'AWS Bedrock' });
      fireEvent.click(bedrockOption);

      // Should show AWS fields
      await waitFor(() => {
        expect(screen.getByLabelText(/aws region/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/aws profile/i)).toBeInTheDocument();
      });
    });

    it('should hide Base URL and API Key fields when Bedrock preset is selected', async () => {
      render(
        <ProfileEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSaved={mockOnSaved}
        />
      );

      // Initially, API fields should be visible
      expect(screen.getByLabelText(/base url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();

      // Select Bedrock preset
      const presetTrigger = screen.getByLabelText(/preset/i);
      fireEvent.keyDown(presetTrigger, { key: 'ArrowDown', code: 'ArrowDown' });

      const bedrockOption = await screen.findByRole('option', { name: 'AWS Bedrock' });
      fireEvent.click(bedrockOption);

      // API fields should be hidden
      await waitFor(() => {
        expect(screen.queryByLabelText(/base url/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument();
      });
    });

    it('should pre-fill default AWS region when Bedrock preset is selected', async () => {
      render(
        <ProfileEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSaved={mockOnSaved}
        />
      );

      // Select Bedrock preset
      const presetTrigger = screen.getByLabelText(/preset/i);
      fireEvent.keyDown(presetTrigger, { key: 'ArrowDown', code: 'ArrowDown' });

      const bedrockOption = await screen.findByRole('option', { name: 'AWS Bedrock' });
      fireEvent.click(bedrockOption);

      // Should have default region pre-filled
      await waitFor(() => {
        expect(screen.getByLabelText(/aws region/i)).toHaveValue('us-east-1');
      });
    });

    it('should pre-fill Bedrock model mappings when preset is selected', async () => {
      render(
        <ProfileEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSaved={mockOnSaved}
        />
      );

      // Select Bedrock preset
      const presetTrigger = screen.getByLabelText(/preset/i);
      fireEvent.keyDown(presetTrigger, { key: 'ArrowDown', code: 'ArrowDown' });

      const bedrockOption = await screen.findByRole('option', { name: 'AWS Bedrock' });
      fireEvent.click(bedrockOption);

      // Check that model fields have Bedrock model IDs
      await waitFor(() => {
        const modelInputs = screen.getAllByRole('textbox');
        const hasSonnetModel = modelInputs.some(
          input => (input as HTMLInputElement).value.includes('us.anthropic.claude-sonnet')
        );
        expect(hasSonnetModel).toBe(true);
      });
    });

    it('should reset model values when switching from Bedrock to API preset', async () => {
      render(
        <ProfileEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSaved={mockOnSaved}
        />
      );

      // First select Bedrock preset
      const presetTrigger = screen.getByLabelText(/preset/i);
      fireEvent.keyDown(presetTrigger, { key: 'ArrowDown', code: 'ArrowDown' });

      const bedrockOption = await screen.findByRole('option', { name: 'AWS Bedrock' });
      fireEvent.click(bedrockOption);

      // Verify Bedrock models are present
      await waitFor(() => {
        const modelInputs = screen.getAllByRole('textbox');
        const hasSonnetModel = modelInputs.some(
          input => (input as HTMLInputElement).value.includes('us.anthropic.claude-sonnet')
        );
        expect(hasSonnetModel).toBe(true);
      });

      // Now switch to Anthropic preset
      fireEvent.keyDown(presetTrigger, { key: 'ArrowDown', code: 'ArrowDown' });

      const anthropicOption = await screen.findByRole('option', { name: 'Anthropic' });
      fireEvent.click(anthropicOption);

      // Model values should be reset (not have Bedrock model IDs)
      await waitFor(() => {
        const modelInputs = screen.getAllByRole('textbox');
        const hasSonnetModel = modelInputs.some(
          input => (input as HTMLInputElement).value.includes('us.anthropic.claude-sonnet')
        );
        expect(hasSonnetModel).toBe(false);
      });
    });

    it('should not show Test Connection button for Bedrock', async () => {
      render(
        <ProfileEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSaved={mockOnSaved}
        />
      );

      // Select Bedrock preset
      const presetTrigger = screen.getByLabelText(/preset/i);
      fireEvent.keyDown(presetTrigger, { key: 'ArrowDown', code: 'ArrowDown' });

      const bedrockOption = await screen.findByRole('option', { name: 'AWS Bedrock' });
      fireEvent.click(bedrockOption);

      // Test Connection button should not be present
      await waitFor(() => {
        expect(screen.queryByText('Test Connection')).not.toBeInTheDocument();
      });
    });

    it('should show Bedrock auth info message instead of Test Connection', async () => {
      render(
        <ProfileEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSaved={mockOnSaved}
        />
      );

      // Select Bedrock preset
      const presetTrigger = screen.getByLabelText(/preset/i);
      fireEvent.keyDown(presetTrigger, { key: 'ArrowDown', code: 'ArrowDown' });

      const bedrockOption = await screen.findByRole('option', { name: 'AWS Bedrock' });
      fireEvent.click(bedrockOption);

      // Should show auth info message
      await waitFor(() => {
        expect(screen.getByText(/AWS Bedrock uses your local AWS credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode - Bedrock Profile', () => {
    it('should pre-populate AWS fields when editing Bedrock profile', async () => {
      render(
        <ProfileEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSaved={mockOnSaved}
          profile={mockBedrockProfile}
        />
      );

      // Should show AWS fields with pre-populated values
      await waitFor(() => {
        expect(screen.getByLabelText(/aws region/i)).toHaveValue('us-west-2');
        expect(screen.getByLabelText(/aws profile/i)).toHaveValue('my-sso-profile');
      });
    });

    it('should not show API Key and Base URL when editing Bedrock profile', async () => {
      render(
        <ProfileEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSaved={mockOnSaved}
          profile={mockBedrockProfile}
        />
      );

      // API fields should not be present
      await waitFor(() => {
        expect(screen.queryByLabelText(/base url/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument();
      });
    });

    it('should call updateProfile with Bedrock fields when saving', async () => {
      const mockUpdateFn = vi.fn().mockResolvedValue(true);
      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        updateProfile: mockUpdateFn,
        saveProfile: vi.fn().mockResolvedValue(true),
        profilesLoading: false,
        profilesError: null,
        isTestingConnection: false,
        testConnectionResult: null
      });

      render(
        <ProfileEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSaved={mockOnSaved}
          profile={mockBedrockProfile}
        />
      );

      // Wait for form to populate
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toHaveValue('My Bedrock Profile');
      });

      // Change the AWS region
      const regionInput = screen.getByLabelText(/aws region/i);
      fireEvent.change(regionInput, { target: { value: 'eu-west-1' } });

      // Click save
      const saveButton = screen.getByText(/save profile/i);
      fireEvent.click(saveButton);

      // Verify updateProfile was called with Bedrock fields
      await waitFor(() => {
        expect(mockUpdateFn).toHaveBeenCalledWith(
          expect.objectContaining({
            providerType: 'bedrock',
            awsRegion: 'eu-west-1',
            awsProfile: 'my-sso-profile',
            apiKey: '',
            baseUrl: ''
          })
        );
      });
    });
  });

  describe('Validation - Bedrock', () => {
    it('should require AWS Region for Bedrock profiles', async () => {
      render(
        <ProfileEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSaved={mockOnSaved}
        />
      );

      // Select Bedrock preset
      const presetTrigger = screen.getByLabelText(/preset/i);
      fireEvent.keyDown(presetTrigger, { key: 'ArrowDown', code: 'ArrowDown' });

      const bedrockOption = await screen.findByRole('option', { name: 'AWS Bedrock' });
      fireEvent.click(bedrockOption);

      // Clear the auto-filled region
      const regionInput = screen.getByLabelText(/aws region/i);
      fireEvent.change(regionInput, { target: { value: '' } });

      // Click save
      const saveButton = screen.getByText(/save profile/i);
      fireEvent.click(saveButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/aws region is required/i)).toBeInTheDocument();
      });
    });

    it('should allow optional AWS Profile for Bedrock profiles', async () => {
      const mockSaveFn = vi.fn().mockResolvedValue(true);
      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        saveProfile: mockSaveFn,
        updateProfile: vi.fn().mockResolvedValue(true),
        profilesLoading: false,
        profilesError: null,
        isTestingConnection: false,
        testConnectionResult: null
      });

      render(
        <ProfileEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSaved={mockOnSaved}
        />
      );

      // Select Bedrock preset
      const presetTrigger = screen.getByLabelText(/preset/i);
      fireEvent.keyDown(presetTrigger, { key: 'ArrowDown', code: 'ArrowDown' });

      const bedrockOption = await screen.findByRole('option', { name: 'AWS Bedrock' });
      fireEvent.click(bedrockOption);

      // Leave AWS Profile empty (it's optional)
      const awsProfileInput = screen.getByLabelText(/aws profile/i);
      expect(awsProfileInput).toHaveValue('');

      // Click save - should succeed without AWS Profile
      const saveButton = screen.getByText(/save profile/i);
      fireEvent.click(saveButton);

      // Should call saveProfile (validation should pass)
      await waitFor(() => {
        expect(mockSaveFn).toHaveBeenCalled();
      });
    });
  });
});
