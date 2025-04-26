import { useEffect } from "react";
import { useView } from "@/hooks/use-view";
import { useQuery } from "@tanstack/react-query";
import ProfileSidebar from "@/components/social/ProfileSidebar";
import TrendingSidebar from "@/components/social/TrendingSidebar";
import PostCard from "@/components/social/PostCard";
import { Post } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function Social() {
  const { setView } = useView();
  const { toast } = useToast();

  useEffect(() => {
    setView("social");
  }, [setView]);

  // Fetch posts
  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  const handleCreatePost = () => {
    toast({
      title: "Coming soon!",
      description: "This feature is not yet implemented.",
    });
  };

  return (
    <div id="socialView" className="container mx-auto px-4 py-6">
      <div className="md:flex md:space-x-6">
        {/* Profile/Navigation Sidebar */}
        <ProfileSidebar />

        {/* Social Feed */}
        <div className="flex-grow">
          {/* Create Post Card */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex space-x-3">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
                alt="User profile"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder="Share something with the community..."
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <div className="flex justify-between mt-2">
                  <div className="flex space-x-2">
                    <button className="flex items-center text-gray-500 hover:text-primary">
                      <i className="ri-image-line mr-1"></i>
                      <span className="text-xs">Photo</span>
                    </button>
                    <button className="flex items-center text-gray-500 hover:text-primary">
                      <i className="ri-shopping-bag-line mr-1"></i>
                      <span className="text-xs">Product</span>
                    </button>
                    <button className="flex items-center text-gray-500 hover:text-primary">
                      <i className="ri-emotion-happy-line mr-1"></i>
                      <span className="text-xs">Feeling</span>
                    </button>
                  </div>
                  <Button
                    onClick={handleCreatePost}
                    size="sm"
                    className="px-3 py-1 bg-primary text-white rounded-full text-xs hover:bg-blue-600"
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Feed Filtering */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex border-b">
              <button className="pb-3 border-b-2 border-primary text-primary font-medium px-4">
                For You
              </button>
              <button className="pb-3 text-gray-500 hover:text-gray-700 font-medium px-4">
                Following
              </button>
              <button className="pb-3 text-gray-500 hover:text-gray-700 font-medium px-4">
                Popular
              </button>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-4">
            {isLoading ? (
              [...Array(3)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : posts && posts.length > 0 ? (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900">No posts yet</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Be the first to share something with the community!
                </p>
                <Button
                  onClick={handleCreatePost}
                  className="mt-4 bg-primary hover:bg-blue-600"
                >
                  Create a Post
                </Button>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <button className="px-6 py-2 bg-white text-primary border border-primary rounded-full text-sm font-medium hover:bg-blue-50 transition">
              Load More
            </button>
          </div>
        </div>

        {/* Trending/Suggestions Sidebar */}
        <TrendingSidebar />
      </div>
    </div>
  );
}
