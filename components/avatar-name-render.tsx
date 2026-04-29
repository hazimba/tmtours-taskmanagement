import { Profile } from "@/app/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface AvatarNameRenderProps {
  size?: "xs" | "sm" | "md" | "lg";
  assignee: Profile;
}

const AvatarNameRender = ({ assignee, size = "md" }: AvatarNameRenderProps) => {
  const fontSize = {
    xs: "text-[9px]",
    sm: "text-[10px]",
    md: "text-[11px]",
    lg: "text-[12px]",
  }[size];

  const avatarSize = {
    xs: "h-4 w-4",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }[size];

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar className={`${avatarSize} shrink-0`}>
        <AvatarImage src={assignee.avatar_url || ""} />
        <AvatarFallback className="rounded-full bg-primary/20 text-primary text-[9px] font-bold">
          {assignee.full_name?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <span className={`truncate ${fontSize} text-muted-foreground`}>
        {assignee.full_name}
      </span>
    </div>
  );
};
export default AvatarNameRender;
