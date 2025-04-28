import { useFollow } from "@/hooks/useFollow";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import FollowButton from "@/components/social/FollowButton";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function FollowingPage() {
  const params = useParams<{ userId: string }>();
  const userId = parseInt(params.userId);
  
  const { getFollowing } = useFollow();
  const { data: following, isLoading } = getFollowing(userId);
  
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
          <CardTitle>Following</CardTitle>
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
          ) : following?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Not following anyone yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {following?.map((followedUser) => (
                <div key={followedUser.id}>
                  <div className="flex items-center justify-between">
                    <Link to={`/profile/${followedUser.id}`}>
                      <div className="flex items-center gap-3 cursor-pointer">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={followedUser.avatar || undefined} alt={followedUser.name} />
                          <AvatarFallback>{followedUser.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{followedUser.name}</p>
                          <p className="text-sm text-muted-foreground">@{followedUser.username}</p>
                        </div>
                      </div>
                    </Link>
                    <FollowButton userId={followedUser.id} />
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