import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const Blog = () => {
  const { data: articles, isLoading } = useBlogPosts();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background safe-area-inset-top pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-6 pb-4"
      >
        <h1 className="text-2xl font-bold text-foreground">Blog</h1>
        <p className="text-muted-foreground">Tips, stories, and running wisdom</p>
      </motion.header>

      <div className="px-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !articles || articles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
              <BookOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No Articles Yet</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Check back later for running tips, training guides, and club stories.
            </p>
          </motion.div>
        ) : (
          articles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden"
                onClick={() => navigate(`/blog/${article.slug}`)}
              >
                <CardContent className="p-0">
                  {article.image_url && (
                    <div className="h-32 bg-muted">
                      <img 
                        src={article.image_url} 
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {article.category}
                    </span>
                    <h3 className="font-semibold text-foreground mt-2">{article.title}</h3>
                    {article.excerpt && (
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-muted-foreground text-xs">
                        {format(new Date(article.created_at), "MMM d, yyyy")}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Blog;
