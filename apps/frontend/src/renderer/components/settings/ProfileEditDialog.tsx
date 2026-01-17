/**
 * ProfileEditDialog - Dialog for creating/editing API profiles
 *
 * Allows users to configure custom Anthropic-compatible API endpoints.
 * Supports all profile fields including optional model name mappings.
 *
 * Features:
 * - Required fields: Name, Base URL, API Key (or AWS Region for Bedrock)
 * - Optional model fields: Default, Haiku, Sonnet, Opus
 * - Form validation with error display
 * - Save button triggers store action (create or update)
 * - Close button cancels without saving
 * - Edit mode: pre-populates form with existing profile data
 * - Edit mode: API key masked with "Change" button
 */
import { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useSettingsStore } from '../../stores/settings-store';
import { ModelSearchableSelect } from './ModelSearchableSelect';
import { useToast } from '../../hooks/use-toast';
import { isValidUrl, isValidApiKey } from '../../lib/profile-utils';
import type { APIProfile, ProfileFormData, APIProviderType } from '@shared/types/profile';
import { maskApiKey } from '../../lib/profile-utils';
import { API_PROVIDER_PRESETS } from '../../../shared/constants';

interface ProfileEditDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Optional callback when profile is successfully saved */
  onSaved?: () => void;
  /** Optional profile for edit mode (undefined = create mode) */
  profile?: APIProfile;
}

// ============================================================================
// Sub-components for provider-specific fields
// ============================================================================

interface BedrockCredentialsFieldsProps {
  awsRegion: string;
  awsProfile: string;
  awsRegionError: string | null;
  onAwsRegionChange: (value: string) => void;
  onAwsProfileChange: (value: string) => void;
}

function BedrockCredentialsFields({
  awsRegion,
  awsProfile,
  awsRegionError,
  onAwsRegionChange,
  onAwsProfileChange
}: BedrockCredentialsFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* AWS Region field (required) */}
      <div className="space-y-2">
        <Label htmlFor="aws-region">
          {t('settings:apiProfiles.fields.awsRegion')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="aws-region"
          placeholder={t('settings:apiProfiles.placeholders.awsRegion')}
          value={awsRegion}
          onChange={(e) => onAwsRegionChange(e.target.value)}
          className={awsRegionError ? 'border-destructive' : ''}
        />
        {awsRegionError && <p className="text-sm text-destructive">{awsRegionError}</p>}
        <p className="text-xs text-muted-foreground">
          {t('settings:apiProfiles.hints.awsRegion')}
        </p>
      </div>

      {/* AWS Profile field (optional) */}
      <div className="space-y-2">
        <Label htmlFor="aws-profile">
          {t('settings:apiProfiles.fields.awsProfile')}
        </Label>
        <Input
          id="aws-profile"
          placeholder={t('settings:apiProfiles.placeholders.awsProfile')}
          value={awsProfile}
          onChange={(e) => onAwsProfileChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {t('settings:apiProfiles.hints.awsProfile')}
        </p>
      </div>
    </div>
  );
}

interface ApiCredentialsFieldsProps {
  baseUrl: string;
  apiKey: string;
  urlError: string | null;
  keyError: string | null;
  isEditMode: boolean;
  isChangingApiKey: boolean;
  profile?: APIProfile;
  baseUrlInputRef: React.RefObject<HTMLInputElement | null>;
  onBaseUrlChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onStartChangingKey: () => void;
  onCancelChangingKey: () => void;
}

function ApiCredentialsFields({
  baseUrl,
  apiKey,
  urlError,
  keyError,
  isEditMode,
  isChangingApiKey,
  profile,
  baseUrlInputRef,
  onBaseUrlChange,
  onApiKeyChange,
  onStartChangingKey,
  onCancelChangingKey
}: ApiCredentialsFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Base URL field (required) */}
      <div className="space-y-2">
        <Label htmlFor="profile-url">
          {t('settings:apiProfiles.fields.baseUrl')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="profile-url"
          placeholder={t('settings:apiProfiles.placeholders.baseUrl')}
          value={baseUrl}
          ref={baseUrlInputRef}
          onChange={(e) => onBaseUrlChange(e.target.value)}
          className={urlError ? 'border-destructive' : ''}
        />
        {urlError && <p className="text-sm text-destructive">{urlError}</p>}
        <p className="text-xs text-muted-foreground">
          {t('settings:apiProfiles.hints.baseUrl')}
        </p>
      </div>

      {/* API Key field (required for create, masked in edit mode) */}
      <div className="space-y-2">
        <Label htmlFor="profile-key">
          {t('settings:apiProfiles.fields.apiKey')} <span className="text-destructive">*</span>
        </Label>
        {isEditMode && !isChangingApiKey && profile ? (
          // Edit mode: show masked API key
          <div className="flex items-center gap-2">
            <Input
              id="profile-key"
              value={maskApiKey(profile.apiKey)}
              disabled
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onStartChangingKey}
            >
              {t('settings:apiProfiles.actions.changeKey')}
            </Button>
          </div>
        ) : (
          // Create mode or changing key: show password input
          <>
            <Input
              id="profile-key"
              type="password"
              placeholder={t('settings:apiProfiles.placeholders.apiKey')}
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              className={keyError ? 'border-destructive' : ''}
            />
            {isEditMode && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancelChangingKey}
              >
                {t('settings:apiProfiles.actions.cancelKeyChange')}
              </Button>
            )}
          </>
        )}
        {keyError && <p className="text-sm text-destructive">{keyError}</p>}
      </div>
    </div>
  );
}

interface BedrockModelFieldsProps {
  defaultModel: string;
  haikuModel: string;
  sonnetModel: string;
  opusModel: string;
  onDefaultModelChange: (value: string) => void;
  onHaikuModelChange: (value: string) => void;
  onSonnetModelChange: (value: string) => void;
  onOpusModelChange: (value: string) => void;
}

function BedrockModelFields({
  defaultModel,
  haikuModel,
  sonnetModel,
  opusModel,
  onDefaultModelChange,
  onHaikuModelChange,
  onSonnetModelChange,
  onOpusModelChange
}: BedrockModelFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="model-default" className="text-sm text-muted-foreground">
          {t('settings:apiProfiles.models.defaultLabel')}
        </Label>
        <Input
          id="model-default"
          placeholder={t('settings:apiProfiles.bedrock.modelPlaceholder')}
          value={defaultModel}
          onChange={(e) => onDefaultModelChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="model-haiku" className="text-sm text-muted-foreground">
          {t('settings:apiProfiles.models.haikuLabel')}
        </Label>
        <Input
          id="model-haiku"
          placeholder={t('settings:apiProfiles.bedrock.haikuPlaceholder')}
          value={haikuModel}
          onChange={(e) => onHaikuModelChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="model-sonnet" className="text-sm text-muted-foreground">
          {t('settings:apiProfiles.models.sonnetLabel')}
        </Label>
        <Input
          id="model-sonnet"
          placeholder={t('settings:apiProfiles.bedrock.sonnetPlaceholder')}
          value={sonnetModel}
          onChange={(e) => onSonnetModelChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="model-opus" className="text-sm text-muted-foreground">
          {t('settings:apiProfiles.models.opusLabel')}
        </Label>
        <Input
          id="model-opus"
          placeholder={t('settings:apiProfiles.bedrock.opusPlaceholder')}
          value={opusModel}
          onChange={(e) => onOpusModelChange(e.target.value)}
        />
      </div>
    </div>
  );
}

interface ApiModelFieldsProps {
  defaultModel: string;
  haikuModel: string;
  sonnetModel: string;
  opusModel: string;
  baseUrl: string;
  apiKey: string;
  onDefaultModelChange: (value: string) => void;
  onHaikuModelChange: (value: string) => void;
  onSonnetModelChange: (value: string) => void;
  onOpusModelChange: (value: string) => void;
}

function ApiModelFields({
  defaultModel,
  haikuModel,
  sonnetModel,
  opusModel,
  baseUrl,
  apiKey,
  onDefaultModelChange,
  onHaikuModelChange,
  onSonnetModelChange,
  onOpusModelChange
}: ApiModelFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="model-default" className="text-sm text-muted-foreground">
          {t('settings:apiProfiles.models.defaultLabel')}
        </Label>
        <ModelSearchableSelect
          value={defaultModel}
          onChange={onDefaultModelChange}
          placeholder={t('settings:apiProfiles.models.defaultPlaceholder')}
          baseUrl={baseUrl}
          apiKey={apiKey}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="model-haiku" className="text-sm text-muted-foreground">
          {t('settings:apiProfiles.models.haikuLabel')}
        </Label>
        <ModelSearchableSelect
          value={haikuModel}
          onChange={onHaikuModelChange}
          placeholder={t('settings:apiProfiles.models.haikuPlaceholder')}
          baseUrl={baseUrl}
          apiKey={apiKey}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="model-sonnet" className="text-sm text-muted-foreground">
          {t('settings:apiProfiles.models.sonnetLabel')}
        </Label>
        <ModelSearchableSelect
          value={sonnetModel}
          onChange={onSonnetModelChange}
          placeholder={t('settings:apiProfiles.models.sonnetPlaceholder')}
          baseUrl={baseUrl}
          apiKey={apiKey}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="model-opus" className="text-sm text-muted-foreground">
          {t('settings:apiProfiles.models.opusLabel')}
        </Label>
        <ModelSearchableSelect
          value={opusModel}
          onChange={onOpusModelChange}
          placeholder={t('settings:apiProfiles.models.opusPlaceholder')}
          baseUrl={baseUrl}
          apiKey={apiKey}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Main component
// ============================================================================

export function ProfileEditDialog({ open, onOpenChange, onSaved, profile }: ProfileEditDialogProps) {
  const { t } = useTranslation();
  const {
    saveProfile,
    updateProfile,
    profilesLoading,
    profilesError,
    testConnection,
    isTestingConnection,
    testConnectionResult
  } = useSettingsStore();
  const { toast } = useToast();

  // Edit mode detection: profile prop determines mode
  const isEditMode = !!profile;

  // Form state
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [defaultModel, setDefaultModel] = useState('');
  const [haikuModel, setHaikuModel] = useState('');
  const [sonnetModel, setSonnetModel] = useState('');
  const [opusModel, setOpusModel] = useState('');
  const [presetId, setPresetId] = useState<string>('');

  // Provider type state
  const [providerType, setProviderType] = useState<APIProviderType>('api');
  const [awsRegion, setAwsRegion] = useState('');
  const [awsProfile, setAwsProfile] = useState('');

  // Derived state
  const isBedrock = providerType === 'bedrock';

  // API key change state (for edit mode)
  const [isChangingApiKey, setIsChangingApiKey] = useState(false);

  // Validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [awsRegionError, setAwsRegionError] = useState<string | null>(null);

  // AbortController ref for test connection cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const baseUrlInputRef = useRef<HTMLInputElement | null>(null);

  // Local state for auto-hiding test result display
  const [showTestResult, setShowTestResult] = useState(false);

  // Auto-hide test result after 5 seconds
  useEffect(() => {
    if (testConnectionResult) {
      setShowTestResult(true);
      const timeoutId = setTimeout(() => {
        setShowTestResult(false);
      }, 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [testConnectionResult]);

  // Cleanup AbortController when dialog closes or unmounts
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  // Reset form and pre-populate when dialog opens
  useEffect(() => {
    if (open) {
      if (isEditMode && profile) {
        // Pre-populate form with existing profile data
        setName(profile.name);
        setBaseUrl(profile.baseUrl);
        setApiKey(''); // Start empty - masked display shown instead
        setDefaultModel(profile.models?.default || '');
        setHaikuModel(profile.models?.haiku || '');
        setSonnetModel(profile.models?.sonnet || '');
        setOpusModel(profile.models?.opus || '');
        setIsChangingApiKey(false);
        setPresetId('');
        setProviderType(profile.providerType || 'api');
        setAwsRegion(profile.awsRegion || '');
        setAwsProfile(profile.awsProfile || '');
      } else {
        // Reset to empty form for create mode
        resetFormToDefaults();
      }
      // Clear validation errors
      clearAllErrors();
    } else {
      // Clear test result display when dialog closes
      setShowTestResult(false);
    }
  }, [open]);

  // Helper to reset form to defaults
  const resetFormToDefaults = () => {
    setName('');
    setBaseUrl('');
    setApiKey('');
    setDefaultModel('');
    setHaikuModel('');
    setSonnetModel('');
    setOpusModel('');
    setIsChangingApiKey(false);
    setPresetId('');
    setProviderType('api');
    setAwsRegion('');
    setAwsProfile('');
  };

  // Helper to clear all validation errors
  const clearAllErrors = () => {
    setNameError(null);
    setUrlError(null);
    setKeyError(null);
    setAwsRegionError(null);
  };

  // Helper to reset model values
  const resetModelValues = () => {
    setDefaultModel('');
    setHaikuModel('');
    setSonnetModel('');
    setOpusModel('');
  };

  const applyPreset = (id: string) => {
    const preset = API_PROVIDER_PRESETS.find((item) => item.id === id);
    if (!preset) return;

    const previousPresetId = presetId;
    setPresetId(id);

    if (preset.isBedrock) {
      // Bedrock preset - set AWS-specific fields
      setProviderType('bedrock');
      setBaseUrl('');
      setApiKey('');
      setAwsRegion(preset.defaultRegion || 'us-east-1');
      // Apply default model mappings for Bedrock
      if (preset.defaultModels) {
        setDefaultModel(preset.defaultModels.default || '');
        setHaikuModel(preset.defaultModels.haiku || '');
        setSonnetModel(preset.defaultModels.sonnet || '');
        setOpusModel(preset.defaultModels.opus || '');
      }
    } else {
      // Standard API preset
      setProviderType('api');
      setBaseUrl(preset.baseUrl);
      setAwsRegion('');
      setAwsProfile('');

      // Reset model values when switching from Bedrock to API in create mode
      // This prevents Bedrock model IDs from being used with API providers
      const previousPreset = API_PROVIDER_PRESETS.find((item) => item.id === previousPresetId);
      if (!isEditMode && previousPreset?.isBedrock) {
        resetModelValues();
      }
    }

    if (!name.trim()) {
      setName(t(preset.labelKey));
    }
  };

  // Validate form based on provider type
  const validateForm = (): boolean => {
    let isValid = true;

    // Name validation (common)
    if (!name.trim()) {
      setNameError(t('settings:apiProfiles.validation.nameRequired'));
      isValid = false;
    } else {
      setNameError(null);
    }

    if (isBedrock) {
      // Bedrock validation
      if (!awsRegion.trim()) {
        setAwsRegionError(t('settings:apiProfiles.validation.awsRegionRequired'));
        isValid = false;
      } else {
        setAwsRegionError(null);
      }
      setUrlError(null);
      setKeyError(null);
    } else {
      // Standard API validation
      setAwsRegionError(null);

      if (!baseUrl.trim()) {
        setUrlError(t('settings:apiProfiles.validation.baseUrlRequired'));
        isValid = false;
      } else if (!isValidUrl(baseUrl)) {
        setUrlError(t('settings:apiProfiles.validation.baseUrlInvalid'));
        isValid = false;
      } else {
        setUrlError(null);
      }

      if (!isEditMode || isChangingApiKey) {
        if (!apiKey.trim()) {
          setKeyError(t('settings:apiProfiles.validation.apiKeyRequired'));
          isValid = false;
        } else if (!isValidApiKey(apiKey)) {
          setKeyError(t('settings:apiProfiles.validation.apiKeyInvalid'));
          isValid = false;
        } else {
          setKeyError(null);
        }
      } else {
        setKeyError(null);
      }
    }

    return isValid;
  };

  // Handle test connection (API only)
  const handleTestConnection = async () => {
    const apiKeyForTest = isEditMode && !isChangingApiKey && profile
      ? profile.apiKey
      : apiKey;

    if (!baseUrl.trim()) {
      setUrlError(t('settings:apiProfiles.validation.baseUrlRequired'));
      return;
    }
    if (!apiKeyForTest.trim()) {
      setKeyError(t('settings:apiProfiles.validation.apiKeyRequired'));
      return;
    }

    abortControllerRef.current = new AbortController();
    await testConnection(baseUrl.trim(), apiKeyForTest.trim(), abortControllerRef.current.signal);
  };

  // Check if form has minimum required fields for test connection
  const isFormValidForTest = () => {
    if (isBedrock) return false;
    if (!name.trim() || !baseUrl.trim()) return false;
    if (!isEditMode || isChangingApiKey) {
      return apiKey.trim().length > 0;
    }
    return true;
  };

  // Build profile data for save
  const buildProfileData = (): ProfileFormData => {
    const data: ProfileFormData = {
      name: name.trim(),
      providerType,
      baseUrl: isBedrock ? '' : baseUrl.trim(),
      apiKey: isBedrock ? '' : apiKey.trim(),
    };

    if (isBedrock) {
      data.awsRegion = awsRegion.trim();
      data.awsProfile = awsProfile.trim() || undefined;
    }

    if (defaultModel || haikuModel || sonnetModel || opusModel) {
      data.models = {};
      if (defaultModel) data.models.default = defaultModel.trim();
      if (haikuModel) data.models.haiku = haikuModel.trim();
      if (sonnetModel) data.models.sonnet = sonnetModel.trim();
      if (opusModel) data.models.opus = opusModel.trim();
    }

    return data;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;

    if (isEditMode && profile) {
      // Update existing profile
      const updatedProfile: APIProfile = {
        ...profile,
        name: name.trim(),
        providerType,
        baseUrl: isBedrock ? '' : baseUrl.trim(),
        ...(isChangingApiKey && !isBedrock && { apiKey: apiKey.trim() }),
        ...(isBedrock ? {
          apiKey: '',
          awsRegion: awsRegion.trim(),
          awsProfile: awsProfile.trim() || undefined
        } : {
          awsRegion: undefined,
          awsProfile: undefined
        }),
        ...(defaultModel || haikuModel || sonnetModel || opusModel ? {
          models: {
            ...(defaultModel && { default: defaultModel.trim() }),
            ...(haikuModel && { haiku: haikuModel.trim() }),
            ...(sonnetModel && { sonnet: sonnetModel.trim() }),
            ...(opusModel && { opus: opusModel.trim() })
          }
        } : { models: undefined })
      };

      const success = await updateProfile(updatedProfile);
      if (success) {
        toast({
          title: t('settings:apiProfiles.toast.update.title'),
          description: t('settings:apiProfiles.toast.update.description', { name: name.trim() }),
        });
        onOpenChange(false);
        onSaved?.();
      }
    } else {
      // Create new profile
      const profileData = buildProfileData();
      const success = await saveProfile(profileData);
      if (success) {
        toast({
          title: t('settings:apiProfiles.toast.create.title'),
          description: t('settings:apiProfiles.toast.create.description', { name: name.trim() }),
        });
        onOpenChange(false);
        onSaved?.();
      }
    }
  };

  // Get the effective API key for model selects (in edit mode without changing key, use profile's key)
  const effectiveApiKey = isEditMode && !isChangingApiKey && profile ? profile.apiKey : apiKey;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[min(92vw,720px)] max-h-[90vh] overflow-y-auto"
        data-testid="profile-edit-dialog"
      >
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? t('settings:apiProfiles.dialog.editTitle')
              : t('settings:apiProfiles.dialog.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('settings:apiProfiles.dialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name and Preset row */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className={`space-y-2 ${isEditMode ? 'md:col-span-2' : ''}`}>
              <Label htmlFor="profile-name">
                {t('settings:apiProfiles.fields.name')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="profile-name"
                placeholder={t('settings:apiProfiles.placeholders.name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={nameError ? 'border-destructive' : ''}
              />
              {nameError && <p className="text-sm text-destructive">{nameError}</p>}
            </div>

            {!isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="profile-preset">{t('settings:apiProfiles.fields.preset')}</Label>
                <Select value={presetId} onValueChange={applyPreset}>
                  <SelectTrigger id="profile-preset">
                    <SelectValue placeholder={t('settings:apiProfiles.placeholders.preset')} />
                  </SelectTrigger>
                  <SelectContent
                    onCloseAutoFocus={(event) => {
                      event.preventDefault();
                      baseUrlInputRef.current?.focus();
                    }}
                  >
                    {API_PROVIDER_PRESETS.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {t(preset.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('settings:apiProfiles.hints.preset')}
                </p>
              </div>
            )}
          </div>

          {/* Provider-specific credentials fields */}
          {isBedrock ? (
            <BedrockCredentialsFields
              awsRegion={awsRegion}
              awsProfile={awsProfile}
              awsRegionError={awsRegionError}
              onAwsRegionChange={setAwsRegion}
              onAwsProfileChange={setAwsProfile}
            />
          ) : (
            <ApiCredentialsFields
              baseUrl={baseUrl}
              apiKey={apiKey}
              urlError={urlError}
              keyError={keyError}
              isEditMode={isEditMode}
              isChangingApiKey={isChangingApiKey}
              profile={profile}
              baseUrlInputRef={baseUrlInputRef}
              onBaseUrlChange={setBaseUrl}
              onApiKeyChange={setApiKey}
              onStartChangingKey={() => setIsChangingApiKey(true)}
              onCancelChangingKey={() => {
                setIsChangingApiKey(false);
                setApiKey('');
                setKeyError(null);
              }}
            />
          )}

          {/* Test Connection / Auth Info */}
          {isBedrock ? (
            <div className="p-3 bg-muted/50 border rounded-lg">
              <p className="text-sm text-muted-foreground">
                {t('settings:apiProfiles.bedrock.authInfo')}
              </p>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleTestConnection}
              disabled={isTestingConnection || !isFormValidForTest()}
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('settings:apiProfiles.testConnection.testing')}
                </>
              ) : (
                t('settings:apiProfiles.testConnection.label')
              )}
            </Button>
          )}

          {/* Inline connection test result */}
          {showTestResult && testConnectionResult && (
            <div className={`flex items-start gap-2 p-3 rounded-lg border ${
              testConnectionResult.success
                ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
            }`}>
              {testConnectionResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  testConnectionResult.success
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {testConnectionResult.success
                    ? t('settings:apiProfiles.testConnection.success')
                    : t('settings:apiProfiles.testConnection.failure')}
                </p>
                <p className={`text-sm ${
                  testConnectionResult.success
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {testConnectionResult.message}
                </p>
              </div>
            </div>
          )}

          {/* Optional model mappings */}
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-base">
              {isBedrock
                ? t('settings:apiProfiles.bedrock.modelsTitle')
                : t('settings:apiProfiles.models.title')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {isBedrock
                ? t('settings:apiProfiles.bedrock.modelsDescription')
                : t('settings:apiProfiles.models.description')}
            </p>

            {isBedrock ? (
              <BedrockModelFields
                defaultModel={defaultModel}
                haikuModel={haikuModel}
                sonnetModel={sonnetModel}
                opusModel={opusModel}
                onDefaultModelChange={setDefaultModel}
                onHaikuModelChange={setHaikuModel}
                onSonnetModelChange={setSonnetModel}
                onOpusModelChange={setOpusModel}
              />
            ) : (
              <ApiModelFields
                defaultModel={defaultModel}
                haikuModel={haikuModel}
                sonnetModel={sonnetModel}
                opusModel={opusModel}
                baseUrl={baseUrl}
                apiKey={effectiveApiKey}
                onDefaultModelChange={setDefaultModel}
                onHaikuModelChange={setHaikuModel}
                onSonnetModelChange={setSonnetModel}
                onOpusModelChange={setOpusModel}
              />
            )}
          </div>

          {/* General error display */}
          {profilesError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{profilesError}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={profilesLoading}
          >
            {t('settings:apiProfiles.actions.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={profilesLoading}
          >
            {profilesLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('settings:apiProfiles.actions.saving')}
              </>
            ) : (
              t('settings:apiProfiles.actions.save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
