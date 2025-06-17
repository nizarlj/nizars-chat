"use node"
import { v } from "convex/values";
import { action } from "./_generated/server";
import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_KEY!;
const ALGORITHM = "aes-256-cbc";

const encrypt = (text: string): string => {
  const key = createHash('sha256').update(ENCRYPTION_KEY).digest();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};

const decrypt = (encryptedText: string): string => {
  const [ivHex, encrypted] = encryptedText.split(':');
  const key = createHash('sha256').update(ENCRYPTION_KEY).digest();
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

export const getApiKeyForProvider = action({
  args: {
    provider: v.string(),
  },
  handler: async (ctx, args): Promise<{ provider: string; key: string } | null> => {
    const apiKeyRecord = await ctx.runQuery(internal.apiKeysData.getEncryptedApiKey, {
      provider: args.provider,
    });
    if (!apiKeyRecord) return null;

    return {
      provider: apiKeyRecord.provider,
      key: decrypt(apiKeyRecord.encryptedKey),
    };
  },
});

export const upsertApiKey = action({
  args: {
    provider: v.string(),
    keyName: v.string(),
    apiKey: v.string(),
    isEnabled: v.optional(v.boolean()),
  },
  returns: v.id("apiKeys"),
  handler: async (ctx, args): Promise<Id<"apiKeys">> => {
    const encryptedKey = encrypt(args.apiKey);
    return await ctx.runMutation(internal.apiKeysData.upsertEncryptedApiKey, {
      provider: args.provider,
      keyName: args.keyName,
      encryptedKey,
      isEnabled: args.isEnabled,
    });
  },
}); 