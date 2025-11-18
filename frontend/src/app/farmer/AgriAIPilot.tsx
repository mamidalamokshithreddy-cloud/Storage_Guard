import { Fragment } from "react";

interface ServiceItem {
  title: string;
  titleTelugu: string;
  description: string;
  descriptionTelugu: string;
  duration: string;
  price: string;
  icon: any;
  available: boolean;
}

interface AgriAIPilotProps {
  agentType: string;
  agentName: string;
  agentNameTelugu: string;
  services?: ServiceItem[];
  isInSidePanel?: boolean;
}

export default function AgriAIPilot(_props: AgriAIPilotProps) {
  return <Fragment />;
}


