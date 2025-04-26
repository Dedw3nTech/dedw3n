import { useEffect, useState } from "react";
import { useView } from "@/hooks/use-view";
import ProfileSidebar from "@/components/social/ProfileSidebar";
import TrendingSidebar from "@/components/social/TrendingSidebar";
import ContentCreator from "@/components/social/ContentCreator";
import ContentFeed from "@/components/social/ContentFeed";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";

export default function Social() {
  const { t } = useTranslation();
  const { setView } = useView();
  const { user } = useAuth();
  const [feedView, setFeedView] = useState("for-you");

  useEffect(() => {
    setView("social");
  }, [setView]);

  return (
    <div id="socialView" className="container mx-auto px-4 py-6">
      <div className="md:flex md:space-x-6">
        {/* Profile/Navigation Sidebar */}
        <ProfileSidebar />

        {/* Social Feed */}
        <div className="flex-grow mb-8">
          {/* Content Creator */}
          {user && (
            <div className="mb-4">
              <ContentCreator />
            </div>
          )}

          {/* Feed Filtering */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <Tabs defaultValue={feedView} onValueChange={setFeedView}>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="for-you">{t("social.for_you")}</TabsTrigger>
                <TabsTrigger value="following">{t("social.following")}</TabsTrigger>
                <TabsTrigger value="popular">{t("social.popular")}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="for-you">
                {/* For You Feed - Shows a mix of content */}
                <ContentFeed />
              </TabsContent>
              
              <TabsContent value="following">
                {/* Following Feed - Shows content from followed users */}
                {user ? (
                  <ContentFeed />
                ) : (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center my-4">
                    <h3 className="text-lg font-medium text-gray-900">{t("social.sign_in_required")}</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {t("social.follow_people")}
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="popular">
                {/* Popular Feed - Shows trending content */}
                <ContentFeed />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Trending/Suggestions Sidebar */}
        <TrendingSidebar />
      </div>
    </div>
  );
}
