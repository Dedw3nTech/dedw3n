import { useFollow } from "@/hooks/useFollow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import FollowButton from "./FollowButton";
import { Skeleton } from "@/components/ui/skeleton";

interface SuggestedUsersProps {
  limit?: number;
  className?: string;
  title?: string;
}

export default function SuggestedUsers({ 
  limit = 5, 
  className = "",
  title = "Suggested Users",
}: SuggestedUsersProps) {
  const { getSuggestedUsers } = useFollow();
  const { data: suggestedUsers, isLoading } = getSuggestedUsers(limit);
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array(3).fill(0).map((_, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-9 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (!suggestedUsers || suggestedUsers.length === 0) {
    return null;
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestedUsers.map((user) => (
          <div key={user.id} className="flex items-center justify-between">
            <Link to={`/profile/${user.id}`}>
              <div className="flex items-center gap-2 cursor-pointer">
                <Avatar>
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </div>
            </Link>
            <FollowButton userId={user.id} size="sm" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}