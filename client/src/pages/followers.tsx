import { useFollow } from "@/hooks/useFollow";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import FollowButton from "@/components/social/FollowButton";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function FollowersPage() {
  const params = useParams<{ userId: string }>();
  const userId = parseInt(params.userId);
  
  const { getFollowers } = useFollow();
  const { data: followers, isLoading } = getFollowers(userId);
  
  if (isNaN(userId)) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold">Invalid user ID</h1>
          <p className="text-muted-foreground mt-2">The user ID provided is not valid.</p>
          <Button className="mt-4" asChild>
            <Link to="/">Go back home</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/profile/${userId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to profile
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Followers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-20" />
                </div>
              ))}
            </div>
          ) : followers?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No followers yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {followers?.map((follower) => (
                <div key={follower.id}>
                  <div className="flex items-center justify-between">
                    <Link to={`/profile/${follower.id}`}>
                      <div className="flex items-center gap-3 cursor-pointer">
                        <UserAvatar userId={follower.id} username={follower.username} size="lg" className="h-12 w-12" />
                        <div>
                          <p className="font-medium">{follower.name}</p>
                          <p className="text-sm text-muted-foreground">@{follower.username}</p>
                        </div>
                      </div>
                    </Link>
                    <FollowButton userId={follower.id} />
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}