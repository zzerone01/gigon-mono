import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@repo/ui";

export function Fallback() {
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarFallback>JC</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-tint text-royal-dark">MG</AvatarFallback>
      </Avatar>
    </div>
  );
}

export function WithImage() {
  return (
    <Avatar>
      <AvatarImage src="https://i.pravatar.cc/80?img=12" alt="Worker" />
      <AvatarFallback>GG</AvatarFallback>
    </Avatar>
  );
}

export function Group() {
  return (
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>JC</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-tint text-royal-dark">MG</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-amber/20 text-amber-dark">RB</AvatarFallback>
      </Avatar>
    </AvatarGroup>
  );
}
