export interface LinkedInPost {
  id: string;
  date: string;
  content: string;
  url: string;
  likes?: number;
  comments?: number;
  tags?: string[];
}

// Add real LinkedIn posts here manually.
// url: the full URL to the specific post (linkedin.com/posts/...)
// The "Recent Posts" section stays hidden while this list is empty.
export const linkedinPosts: LinkedInPost[] = [];
