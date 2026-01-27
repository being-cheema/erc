import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBlogPost } from "@/hooks/useBlogPosts";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import DOMPurify from "dompurify";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: post, isLoading, error } = useBlogPost(slug || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background safe-area-inset-top">
        <div className="px-4 pt-6">
          <Button variant="ghost" onClick={() => navigate("/blog")} className="-ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </div>
        <div className="px-4 py-12 text-center">
          <h1 className="text-xl font-bold text-foreground">Post Not Found</h1>
          <p className="text-muted-foreground mt-2">
            The article you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-area-inset-top pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-6 pb-4"
      >
        <Button variant="ghost" onClick={() => navigate("/blog")} className="-ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog
        </Button>
      </motion.header>

      {/* Hero Image */}
      {post.image_url && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-56 bg-muted relative"
        >
          <img 
            src={post.image_url} 
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </motion.div>
      )}

      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-xs gradient-primary text-white px-2.5 py-1 rounded-full font-medium inline-block">
            {post.category}
          </span>
          
          <h1 className="text-2xl font-bold text-foreground mt-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 mt-3 text-muted-foreground text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(post.created_at), "MMMM d, yyyy")}</span>
            </div>
          </div>

          {post.excerpt && (
            <p className="text-muted-foreground mt-6 text-lg leading-relaxed border-l-2 border-primary pl-4">
              {post.excerpt}
            </p>
          )}

          <div className="prose prose-neutral dark:prose-invert max-w-none mt-8">
            <div 
              className="text-foreground leading-relaxed whitespace-pre-wrap font-sans"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(post.content, {
                  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'span', 'div'],
                  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
                  ALLOW_DATA_ATTR: false,
                })
              }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogPost;
