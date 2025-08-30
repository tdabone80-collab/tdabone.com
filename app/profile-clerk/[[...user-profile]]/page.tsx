"use client";

// import Layout from "@/components/layout";
import { UserProfile } from "@clerk/nextjs";
import { History } from "lucide-react";

// import { CustomProfilePage, CustomTerms } from "../components";
// import { CustomIcon } from "../icons";

const UserProfilePage = () => (
  <div>
       <div className="max-w-screen-lg mx-auto container py-12">
            <UserProfile path="/profile" routing="path">
                <UserProfile.Page label="account" />
                <UserProfile.Page label="security" />
                <UserProfile.Link label="Go Back" labelIcon={<History size={20} />} url="/my-account" />
            </UserProfile>
       </div>
  </div>
);

export default UserProfilePage;