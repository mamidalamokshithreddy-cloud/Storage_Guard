import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { PlayCircle, VideoIcon, Clock, Users } from "lucide-react";

interface AgentVideoSectionProps {
  agentName: string;
  agentNameTelugu: string;
  videos: {
    title: string;
    titleTelugu: string;
    duration: string;
    type: "demo" | "tutorial" | "case-study";
    thumbnail?: string;
    videoId?: string; // For future video integration
  }[];
}

const AgentVideoSection = ({ agentName, agentNameTelugu, videos }: AgentVideoSectionProps) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "demo": return "bg-primary/10 text-primary border-primary/20";
      case "tutorial": return "bg-accent/10 text-accent border-accent/20";
      case "case-study": return "bg-success/10 text-success border-success/20";
      default: return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "demo": return "Demo";
      case "tutorial": return "Tutorial | ట్యుటోరియల్";
      case "case-study": return "Case Study | కేస్ స్టడీ";
      default: return "Video";
    }
  };

  return (
    <Card className="agri-card mt-8">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <VideoIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">
              {agentName} Videos | వీడియోలు
            </h3>
            <p className="text-sm text-muted-foreground">
              Learn {agentName} ({agentNameTelugu}) through interactive videos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video, index) => (
            <Card 
              key={index} 
              className="cursor-pointer hover:shadow-md transition-all duration-200 border-border hover:border-primary/20 group"
            >
              <div className="p-4">
                {/* Video Thumbnail Placeholder */}
                <div className="relative mb-3 bg-gradient-to-br from-muted to-muted/50 rounded-lg aspect-video flex items-center justify-center group-hover:from-primary/10 group-hover:to-accent/10 transition-all duration-200">
                  <PlayCircle className="w-12 h-12 text-primary group-hover:scale-110 transition-transform duration-200" />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {video.duration}
                    </Badge>
                  </div>
                </div>

                {/* Video Info */}
                <div className="space-y-2">
                  <Badge className={`text-xs ${getTypeColor(video.type)}`}>
                    {getTypeLabel(video.type)}
                  </Badge>
                  
                  <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                    {video.title}
                  </h4>
                  
                  <p className="text-xs text-accent font-medium">
                    {video.titleTelugu}
                  </p>
                </div>

                {/* Play Button */}
                <Button 
                  size="sm" 
                  className="w-full mt-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  variant="outline"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Watch Video
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Coming Soon Placeholder if no videos */}
        {videos.length === 0 && (
          <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
            <VideoIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-foreground mb-2">Videos Coming Soon</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Interactive video tutorials for {agentName} will be available here
            </p>
            <Badge variant="secondary" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              In Production | ఉత్పాదనలో
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AgentVideoSection;