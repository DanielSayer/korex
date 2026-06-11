import type {
  TrainingNoteTag,
  TrainingNoteTagColor,
} from "@korex/api/modules/training-notes/training-notes.types";
import { Button } from "@korex/ui/components/button";
import { Input } from "@korex/ui/components/input";
import { Label } from "@korex/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@korex/ui/components/sheet";
import { SaveIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { TrainingNoteTagColorPicker } from "./training-note-tag-color-picker";
import { TrainingNoteTagPreview } from "./training-note-tag-preview";

function TrainingNoteTagSheet({
  isPending,
  mode,
  onOpenChange,
  onSubmit,
  open,
  tag,
}: {
  isPending: boolean;
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { color: TrainingNoteTagColor; name: string }) => void;
  open: boolean;
  tag?: TrainingNoteTag | null;
}) {
  const [name, setName] = useState(tag?.name ?? "");
  const [color, setColor] = useState<TrainingNoteTagColor>(
    tag?.color ?? "slate",
  );

  useEffect(() => {
    if (open) {
      setName(tag?.name ?? "");
      setColor(tag?.color ?? "slate");
    }
  }, [open, tag]);

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="border-b p-5">
          <SheetTitle>
            {mode === "create" ? "New Training Note Tag" : "Edit Tag"}
          </SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Create a reusable tag for Training Notes."
              : "Update this tag everywhere it appears."}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 p-5">
          <div className="space-y-2">
            <Label htmlFor="training-note-tag-name">Name</Label>
            <Input
              autoFocus
              id="training-note-tag-name"
              onChange={(event) => setName(event.target.value)}
              placeholder="fatigue"
              value={name}
            />
          </div>
          <div className="space-y-3">
            <Label>Color</Label>
            <TrainingNoteTagColorPicker color={color} onChange={setColor} />
          </div>
          <div className="space-y-2">
            <Label>Preview</Label>
            <div>
              <TrainingNoteTagPreview color={color} name={name || "Tag"} />
            </div>
          </div>
        </div>
        <SheetFooter className="border-t p-5 sm:flex-row sm:justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={name.trim().length === 0 || isPending}
            onClick={() => onSubmit({ color, name })}
            type="button"
          >
            <SaveIcon className="size-4" />
            {mode === "create" ? "Create tag" : "Save tag"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export { TrainingNoteTagSheet };
