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
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Explore</p>
        <h1 className="text-xl font-black text-foreground uppercase tracking-tight">Blog</h1>
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
            <div className="w-20 h-20 mx-auto rounded-full gradient-primary flex items-center justify-center mb-4 glow-primary">
              <BookOpen className="w-10 h-10 text-white" />
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
                className="cursor-pointer card-hover overflow-hidden border-border/50"
                onClick={() => navigate(`/blog/${article.slug}`)}
              >
                <CardContent className="p-0">
                  {article.image_url && (
                    <div className="h-40 bg-muted relative">
                      <img 
                        src={article.image_url} 
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className="absolute bottom-3 left-3 text-xs gradient-primary text-white px-2.5 py-1 rounded-full font-medium">
                        {article.category}
                      </span>
                    </div>
                  )}
                  <div className="p-4">
                    {!article.image_url && (
                      <span className="text-xs gradient-primary text-white px-2.5 py-1 rounded-full font-medium inline-block mb-2">
                        {article.category}
                      </span>
                    )}
                    <h3 className="font-semibold text-foreground font-sans text-lg">{article.title}</h3>
                    {article.excerpt && (
                      <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-muted-foreground text-xs">
                        {format(new Date(article.created_at), "MMM d, yyyy")}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-xs">
                          {Math.max(1, Math.ceil(((article.content?.length || 0) / 5) / 200))} min read
                        </span>
                        <div className="flex items-center gap-1 text-primary text-sm font-medium">
                          <span>Read more</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
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
