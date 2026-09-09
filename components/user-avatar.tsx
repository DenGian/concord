import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
	src?: string;
	name?: string;
	className?: string;
}

/** Round profile picture with the user's initial as fallback. */
export const UserAvatar = ({ src, name, className }: UserAvatarProps) => {
	return (
		<Avatar className={cn("h-7 w-7 md:h-10 md:w-10", className)}>
			<AvatarImage src={src} alt={name ?? "User avatar"} />
			<AvatarFallback>{name?.charAt(0).toUpperCase() ?? "?"}</AvatarFallback>
		</Avatar>
	);
};
