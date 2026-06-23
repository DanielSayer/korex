import { Button } from "@korex/ui/components/button";
import { Input } from "@korex/ui/components/input";
import { Label } from "@korex/ui/components/label";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { SettingsSection } from "./settings-section";

function ProfileSettings() {
  const session = authClient.useSession();
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (session.data?.user.name) {
      setName(session.data.user.name);
    }
  }, [session.data?.user.name]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName || nextName === session.data?.user.name) {
      return;
    }

    setIsSaving(true);
    const result = await authClient.updateUser({ name: nextName });
    setIsSaving(false);

    if (result.error) {
      toast.error(result.error.message ?? "Could not update your profile");
      return;
    }

    await session.refetch();
    toast.success("Profile updated");
  };

  return (
    <SettingsSection
      description="Manage the identity shown across your training workspace."
      title="Profile"
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Display name</Label>
            <Input
              id="profile-name"
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Primary email</Label>
            <Input
              id="profile-email"
              readOnly
              value={session.data?.user.email ?? ""}
            />
            <p className="text-muted-foreground text-xs">
              Email changes are not currently supported.
            </p>
          </div>
        </div>
        <Button
          disabled={
            isSaving ||
            !name.trim() ||
            name.trim() === session.data?.user.name
          }
          type="submit"
        >
          {isSaving ? "Saving..." : "Save profile"}
        </Button>
      </form>
    </SettingsSection>
  );
}

export { ProfileSettings };
