export type ApiProviderPreset = {
  id: string;
  baseUrl: string;
  labelKey: string;
  /** If true, this provider uses AWS credentials instead of API key */
  isBedrock?: boolean;
  /** Default AWS region for Bedrock */
  defaultRegion?: string;
  /** Default model mappings for this provider */
  defaultModels?: {
    default?: string;
    haiku?: string;
    sonnet?: string;
    opus?: string;
  };
};

export const API_PROVIDER_PRESETS: readonly ApiProviderPreset[] = [
  {
    id: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    labelKey: 'settings:apiProfiles.presets.anthropic'
  },
  {
    id: 'bedrock',
    baseUrl: '', // Bedrock doesn't use base URL - uses AWS SDK
    labelKey: 'settings:apiProfiles.presets.bedrock',
    isBedrock: true,
    defaultRegion: 'us-east-1',
    defaultModels: {
      default: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
      haiku: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
      sonnet: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
      opus: 'us.anthropic.claude-opus-4-5-20251101-v1:0'
    }
  },
  {
    id: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    labelKey: 'settings:apiProfiles.presets.openrouter'
  },
  {
    id: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    labelKey: 'settings:apiProfiles.presets.groq'
  },
  {
    id: 'glm-global',
    baseUrl: 'https://api.z.ai/api/anthropic',
    labelKey: 'settings:apiProfiles.presets.glmGlobal'
  },
  {
    id: 'glm-cn',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    labelKey: 'settings:apiProfiles.presets.glmChina'
  }
];
