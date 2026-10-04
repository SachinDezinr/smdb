import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { showError, showSuccess } from "@/utils/toast";

const MIN_PASSWORD_LENGTH = 6;

export const SecuritySection = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const handleUpdatePassword = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      showError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    setPassLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      showSuccess("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Failed to update password.",
      );
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      aria-labelledby="security-title"
      className="rounded-3xl border border-white/10 bg-neutral-950/70 p-6 md:p-8 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
          <KeyRound size={18} aria-hidden="true" />
        </div>

        <div>
          <h3
            id="security-title"
            className="text-lg font-bold text-white tracking-tight"
          >
            Security & Password
          </h3>

          <p className="text-xs text-muted-foreground">
            Keep your SMDB credentials protected with a strong password.
          </p>
        </div>
      </div>

      <form onSubmit={handleUpdatePassword} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="new-password"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              New Password
            </label>

            <div className="relative">
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
                aria-hidden="true"
              />

              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                className="w-full bg-white/[0.04] border border-white/10 focus:border-primary/60 rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowNewPassword((visible) => !visible)}
                aria-label={
                  showNewPassword ? "Hide new password" : "Show new password"
                }
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors p-1"
              >
                {showNewPassword ? (
                  <EyeOff size={16} aria-hidden="true" />
                ) : (
                  <Eye size={16} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirm-password"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Confirm New Password
            </label>

            <div className="relative">
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
                aria-hidden="true"
              />

              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                className="w-full bg-white/[0.04] border border-white/10 focus:border-primary/60 rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((visible) => !visible)
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide confirmed password"
                    : "Show confirmed password"
                }
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors p-1"
              >
                {showConfirmPassword ? (
                  <EyeOff size={16} aria-hidden="true" />
                ) : (
                  <Eye size={16} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={passLoading || !newPassword || !confirmPassword}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-primary hover:text-black text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-white/10 disabled:hover:text-white"
          >
            {passLoading ? (
              <Loader2
                className="animate-spin"
                size={14}
                aria-hidden="true"
              />
            ) : (
              <Check size={14} aria-hidden="true" />
            )}
            Update Password
          </button>
        </div>
      </form>
    </motion.section>
  );
};