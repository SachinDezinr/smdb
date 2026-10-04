import { useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import {
  Check,
  Edit3,
  Loader2,
  UserCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { setCachedProfile } from "@/lib/profileStore";
import { showError, showSuccess } from "@/utils/toast";

interface PersonalInfoSectionProps {
  user: User;
  initialUsername: string;
  onUsernameUpdated: (newUsername: string) => void;
}

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9._]*[a-zA-Z0-9]$/;

export const PersonalInfoSection = ({
  user,
  initialUsername,
  onUsernameUpdated,
}: PersonalInfoSectionProps) => {
  const [username, setUsername] = useState(initialUsername);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!USERNAME_REGEX.test(username)) {
      showError(
        "Username must start/end with letters, and only contain letters, numbers, _ or .",
      );
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { username },
      });

      if (authError) {
        throw authError;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ username })
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      setCachedProfile({ username });
      onUsernameUpdated(username);
      showSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Failed to update profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setUsername(initialUsername);
    setIsEditing(false);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      aria-labelledby="personal-information-title"
      className="rounded-3xl border border-white/10 bg-neutral-950/70 p-6 md:p-8 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <UserCheck size={18} aria-hidden="true" />
          </div>

          <div>
            <h3
              id="personal-information-title"
              className="text-lg font-bold text-white tracking-tight"
            >
              Personal Information
            </h3>
            <p className="text-xs text-muted-foreground">
              Manage your display username.
            </p>
          </div>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-primary hover:text-black border border-white/10 hover:border-primary text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex-shrink-0"
          >
            <Edit3 size={14} aria-hidden="true" />
            Edit Profile
          </button>
        )}
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="profile-username"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Username
            </label>

            <input
              id="profile-username"
              type="text"
              disabled={!isEditing}
              autoComplete="username"
              className="w-full bg-white/[0.04] border border-white/10 focus:border-primary/60 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />

            <p className="text-[11px] text-muted-foreground">
              Used for friend searches and social comparisons.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="profile-email"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Registered Email
            </label>

            <input
              id="profile-email"
              type="email"
              disabled
              autoComplete="email"
              className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 px-4 text-sm text-white/50 cursor-not-allowed"
              value={user.email ?? ""}
              readOnly
            />

            <p className="text-[11px] text-muted-foreground">
              Contact support to change your account email.
            </p>
          </div>
        </div>

        {isEditing && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-black text-xs font-bold rounded-xl transition-all shadow-md shadow-primary/20 disabled:opacity-50"
            >
              {loading ? (
                <Loader2
                  className="animate-spin"
                  size={14}
                  aria-hidden="true"
                />
              ) : (
                <Check size={14} aria-hidden="true" />
              )}
              Save Changes
            </button>
          </div>
        )}
      </form>
    </motion.section>
  );
};