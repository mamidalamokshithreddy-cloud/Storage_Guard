import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "../farmer/ui/button";
import { Input } from "../farmer/ui/input";
import { ScrollArea } from "../farmer/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../farmer/ui/select";
import { 
  MessageCircle, 
  Mic, 
  MicOff, 
  Send, 
  X, 
  Volume2, 
  VolumeX,
  User,
  Bot,
  Minimize2,
  Maximize2,
  Languages
} from "lucide-react";
import { useToast } from "../farmer/ui/use-toast";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isVoice?: boolean;
}

const AgriChatAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [language, setLanguage] = useState('english');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Define helper functions first
  const getAgriResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (language === 'telugu') {
      // Telugu responses with more comprehensive keyword matching
      if (message.includes('మట్టి') || message.includes('ph') || message.includes('పోషకాలు') || message.includes('soil') || message.includes('nutrients') || message.includes('మట్టి పరీక్ష')) {
        return "మంచి మట్టి ఆరోగ్యం కోసం, pH స్థాయిలను పరీక్షించాలని సిఫారసు చేస్తున్నాను (చాలా పంటలకు 6.0-7.0 అనువైనది), నైట్రోజన్, ఫాస్ఫరస్ మరియు పొటాషియం స్థాయిలు. మా SoilSense ఏజెంట్ మట్టి కూర్పును విశ్లేషించి వివరణాత్మక పోషక సిఫారసులు అందించగలదు. మట్టి పరీక్ష ప్రక్రియలో మిమ్మల్ని మార్గదర్శనం చేయాలా?";
      }
      
      if (message.includes('విత్తనాలు') || message.includes('నాటడం') || message.includes('వేయడం') || message.includes('seed') || message.includes('plant') || message.includes('విత్తనం')) {
        return "విత్తన నాటడంలో విజయం మట్టి ఉష్ణోగ్రత, తేమ మరియు అంతరంపై ఆధారపడుతుంది. మంచి ఫలితాల కోసం: చల్లని పంటలకు మట్టి ఉష్ణోగ్రత 50-60°F, వేడిమి పంటలకు 60-70°F ఉండాలి. నాటడం లోతు విత్తనం వ్యాసం కంటే 2-3 రెట్లు ఉండాలి. మా SeedPlanner మీ ప్రాంతానికి సరైన రకాలు మరియు సమయాన్ని ఎంచుకోవడంలో సహాయపడుతుంది.";
      }
      
      if (message.includes('నీరు') || message.includes('నీటిపారుదల') || message.includes('కరువు') || message.includes('water') || message.includes('irrigation') || message.includes('నీళ్లు')) {
        return "సరైన నీటిపారుదల పంట ఆరోగ్యానికి కీలకం! నీరు సామర్థ్యం కోసం డ్రిప్ నీటిపారుదలను పరిగణించండి, వేరు లోతులో మట్టి తేమను పర్యవేక్షించండి, మరియు ఆవిరిని తగ్గించడానికి తెల్లవారుజామున నీరు పోయండి. మా AquaGuide ఏజెంట్ పంట రకం, వాతావరణం మరియు మట్టి పరిస్థితుల ఆధారంగా మీ నీటిపారుదల షెడ్యూల్‌ను అనుకూలీకరించడంలో సహాయపడుతుంది.";
      }
      
      if (message.includes('కీటకాలు') || message.includes('వ్యాధులు') || message.includes('రక్షణ') || message.includes('pest') || message.includes('disease') || message.includes('protection')) {
        return "సమగ్ర కీటక నిర్వహణ (IPM) కీలకం! పంట మార్పిడి, ప్రయోజనకరమైన కీటకాలు మరియు లక్షిత చికిత్సలను ఉపయోగించండి. త్వరగా గుర్తించడం కోసం క్రమం తప్పకుండా పర్యవేక్షించండి. మా CropShield ఏజెంట్ బెదిరింపులను గుర్తించి పర్యావరణ అనుకూల పరిష్కారాలను సిఫారసు చేయడంలో సహాయపడుతుంది.";
      }
      
      if (message.includes('ఎరువులు') || message.includes('పోషకాలు') || message.includes('నైట్రోజన్') || message.includes('fertilizer') || message.includes('nutrients')) {
        return "సమతుల్య ఎరువులు దిగుబడిని పెంచుతాయి! మట్టి పరీక్షల ఆధారంగా అనువర్తనలు - సాధారణ NPK నిష్పత్తులు పంట ప్రకారం మారుతాయి. మట్టి ఆరోగ్యం కోసం కంపోస్ట్ వంటి సేంద్రియ ఎంపికలను పరిగణించండి. మా NutriDose ఏజెంట్ మీ మట్టి విశ్లేషణ మరియు పంట అవసరాల ఆధారంగా అనుకూలీకరించిన ఎరువు కార్యక్రమాలను సృష్టించగలదు.";
      }
      
      if (message.includes('కోత') || message.includes('సమయం') || message.includes('పరిపక్వత') || message.includes('harvest') || message.includes('timing')) {
        return "సరైన కోత సమయం నాణ్యత మరియు దిగుబడిని పెంచుతుంది! రంగు, గట్టిదనం మరియు తేమ కంటెంట్ వంటి పంట పరిపక్వత సూచికలను పర్యవేక్షించండి. వాతావరణ పరిస్థితులు ముఖ్యం - తడిగా ఉన్నప్పుడు కోత నివారించండి. మా HarvestBot సరైన కోత కిటికీలను అంచనా వేయడంలో మరియు లాజిస్టిక్స్‌ను సమన్వయం చేయడంలో సహాయపడుతుంది.";
      }
      
      if (message.includes('మార్కెట్') || message.includes('ధర') || message.includes('అమ్మకం') || message.includes('market') || message.includes('price') || message.includes('sell')) {
        return "మార్కెట్ సమయం లాభదాయకతను గణనీయంగా ప్రభావితం చేస్తుంది! కమోడిటీ ధరలను పర్యవేక్షించండి, తక్షణ అమ్మకానికి వ్యతిరేకంగా నిల్వ ఖర్చులను పరిగణించండి మరియు ప్రత్యక్ష-వినియోగదారుడికి ఎంపికలను అన్వేషించండి. మా MarketConnect ఏజెంట్ నిజ-సమయ ధర డేటాను అందిస్తుంది మరియు ఉత్తమ ఒప్పందాల కోసం కొనుగోలుదారులతో మిమ్మల్ని కనెక్ట్ చేస్తుంది.";
      }
      
      return "నేను మీ అన్ని వ్యవసాయ అవసరాలతో సహాయం చేయడానికి ఇక్కడ ఉన్నాను! మట్టి పరీక్ష, పంట ప్రణాళిక, నీటిపారుదల నిర్వహణ, కీటక నియంత్రణ, ఎరువుల వేయడం, కోత అనుకూలీకరణ మరియు మార్కెట్ సమాచారంతో సహాయం చేయగలను. మీరు ఏ నిర్దిష్ట వ్యవసాయ సవాలు గురించి చర్చించాలనుకుంటున్నారు?";
    }
    
    // English responses
    if (message.includes('soil') || message.includes('ph') || message.includes('nutrients')) {
      return "For optimal soil health, I recommend testing pH levels (ideal 6.0-7.0 for most crops), nitrogen, phosphorus, and potassium levels. Our SoilSense agent can help you analyze soil composition and provide detailed nutrient recommendations. Would you like me to guide you through the soil testing process?";
    }
    
    // Seed Planting responses
    if (message.includes('seed') || message.includes('plant') || message.includes('sowing')) {
      return "Seed planting success depends on soil temperature, moisture, and spacing. For optimal results: ensure soil temperature is 50-60°F for cool crops, 60-70°F for warm crops. Plant depth should be 2-3 times the seed diameter. Our SeedPlanner can help you choose the right varieties and timing for your region.";
    }
    
    // Irrigation responses
    if (message.includes('water') || message.includes('irrigation') || message.includes('drought')) {
      return "Proper irrigation is crucial for crop health! Consider drip irrigation for water efficiency, monitor soil moisture at root depth, and water early morning to reduce evaporation. Our AquaGuide agent can help optimize your irrigation schedule based on crop type, weather, and soil conditions.";
    }
    
    // Crop Protection responses
    if (message.includes('pest') || message.includes('disease') || message.includes('protection')) {
      return "Integrated Pest Management (IPM) is key! Use crop rotation, beneficial insects, and targeted treatments. Monitor regularly for early detection. Our CropShield agent can help identify threats and recommend eco-friendly solutions. Prevention is always better than treatment!";
    }
    
    // Fertilizer responses
    if (message.includes('fertilizer') || message.includes('nutrients') || message.includes('nitrogen')) {
      return "Balanced fertilization boosts yields! Base applications on soil tests - typical NPK ratios vary by crop. Consider organic options like compost for soil health. Our NutriDose agent can create customized fertilizer programs based on your soil analysis and crop requirements.";
    }
    
    // Harvest responses
    if (message.includes('harvest') || message.includes('timing') || message.includes('mature')) {
      return "Optimal harvest timing maximizes quality and yield! Monitor crop maturity indicators like color, firmness, and moisture content. Weather conditions matter - avoid harvesting when wet. Our HarvestBot can help predict optimal harvest windows and coordinate logistics.";
    }
    
    // Market responses
    if (message.includes('market') || message.includes('price') || message.includes('sell')) {
      return "Market timing can significantly impact profitability! Monitor commodity prices, consider storage costs vs. immediate sale, and explore direct-to-consumer options. Our MarketConnect agent provides real-time price data and connects you with buyers for the best deals.";
    }
    
    // Weather responses
    if (message.includes('weather') || message.includes('rain') || message.includes('temperature')) {
      return "Weather monitoring is essential for farming decisions! Track temperature, precipitation, humidity, and wind patterns. Use weather forecasts for irrigation, spraying, and harvest planning. I can help you interpret weather data for your specific farming operations.";
    }
    
    // Technology responses
    if (message.includes('technology') || message.includes('drone') || message.includes('sensor')) {
      return "Modern farming technology can boost efficiency and yields! Drones for field monitoring, soil sensors for precise irrigation, GPS for accurate planting. Our agents integrate various technologies to provide data-driven insights for smarter farming decisions.";
    }
    
    // Default response
    return "I'm here to help with all your agricultural needs! I can assist with soil testing, crop planning, irrigation management, pest control, fertilization, harvest optimization, and market insights. What specific farming challenge would you like to discuss?";
  };

  const speakText = (text: string) => {
    if (!speechSynthesisRef.current || isMuted) return;

    // Cancel any ongoing speech
    speechSynthesisRef.current.cancel();

    // Wait for voices to be loaded
    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1.3; // Higher pitch for female voice
      utterance.volume = 0.9;
      
      // Get available voices
      const voices = speechSynthesisRef.current?.getVoices() || [];
      
      // Find Indian female voice
      let selectedVoice = null;
      
      if (language === 'telugu') {
        // Look for Telugu voices first, then Hindi as fallback
        selectedVoice = voices.find(voice => 
          voice.lang.includes('te-IN') || voice.lang.includes('te')
        );
        
        // If no Telugu, try Hindi female voices
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.lang.includes('hi-IN') && 
            (voice.name.toLowerCase().includes('female') || 
             voice.name.toLowerCase().includes('woman') ||
             voice.name.toLowerCase().includes('priya') ||
             voice.name.toLowerCase().includes('kalpana') ||
             voice.name.toLowerCase().includes('aditi'))
          );
        }
        
        // Fallback to any Hindi or Indian voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.lang.includes('hi-IN') || voice.lang.includes('en-IN')
          );
        }
      } else {
        // Look for English Indian female voices
        selectedVoice = voices.find(voice => 
          voice.lang.includes('en-IN') && 
          (voice.name.toLowerCase().includes('female') || 
           voice.name.toLowerCase().includes('woman') ||
           voice.name.toLowerCase().includes('veena') ||
           voice.name.toLowerCase().includes('ravi') ||
           voice.name.toLowerCase().includes('aditi'))
        );
        
        // Fallback to any English Indian voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => voice.lang.includes('en-IN'));
        }
      }
      
      // Set the selected voice
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
        console.log('Using voice:', selectedVoice.name, selectedVoice.lang);
      } else {
        // Final fallback
        utterance.lang = language === 'telugu' ? 'te-IN' : 'en-IN';
        console.log('Using fallback language:', utterance.lang);
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
      };

      speechSynthesisRef.current?.speak(utterance);
    };

    // If voices aren't loaded yet, wait for them
    if (speechSynthesisRef.current.getVoices().length === 0) {
      speechSynthesisRef.current.onvoiceschanged = () => {
        speak();
        if (speechSynthesisRef.current) {
          speechSynthesisRef.current.onvoiceschanged = null; // Remove listener after use
        }
      };
    } else {
      speak();
    }
  };

  // Declare handleSendMessage using useCallback
  const handleSendMessage = useCallback(async (text: string, isVoiceInput = false) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
      isVoice: isVoiceInput,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const aiResponse = getAgriResponse(text);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsProcessing(false);

      // Speak the response if not muted
      if (!isMuted && speechSynthesisRef.current) {
        speakText(aiResponse);
      }
    }, 1000 + Math.random() * 1000);
  }, [language, isMuted, getAgriResponse, speakText]);

  // Update welcome message when language changes
  useEffect(() => {
    const updateWelcomeMessage = () => {
      setMessages([{
        id: '1',
        text: language === 'telugu' 
          ? 'నమస్కారం! నేను మీ AgriHub AI సహాయకుడిని. మట్టి పరీక్ష, పంట నిర్వహణ, నీటిపారుదల, కోత మరియు మార్కెట్ సమాచారంలో సహాయం చేయగలను. ఈరోజు మీకు ఎలా సహాయం చేయాలి? 🌾'
          : 'Hello! I\'m your AgriHub AI Assistant. I can help you with soil testing, crop management, irrigation, harvesting, and market insights. How can I assist you today? 🌾',
        isUser: false,
        timestamp: new Date(),
      }]);
    };
    
    setTimeout(updateWelcomeMessage, 0);
  }, [language]);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Speech Recognition Setup
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'telugu' ? 'te-IN' : 'en-IN';

        recognitionRef.current.onstart = () => {
          setIsListening(true);
        };

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setIsListening(false);
          handleSendMessage(transcript, true);
        };

        recognitionRef.current.onerror = () => {
          setIsListening(false);
          toast({
            variant: "destructive",
            title: "Voice Recognition Error",
            description: "Please try again or check microphone permissions.",
          });
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      } catch (error) {
        console.log('Speech recognition initialization failed:', error);
      }
    }

    // Speech Synthesis Setup
    if ('speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
    }
  }, [language, toast]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.log('Error starting speech recognition:', error);
        toast({
          variant: "destructive",
          title: language === 'telugu' ? "వాయిస్ మద్దతు లేదు" : "Voice Not Supported",
          description: language === 'telugu' 
            ? "మీ బ్రౌజర్ స్పీచ్ గుర్తింపుకు మద్దతు ఇవ్వదు."
            : "Your browser doesn't support speech recognition.",
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: language === 'telugu' ? "వాయిస్ మద్దతు లేదు" : "Voice Not Supported",
        description: language === 'telugu' 
          ? "మీ బ్రౌజర్ స్పీచ్ గుర్తింపుకు మద్దతు ఇవ్వదు."
          : "Your browser doesn't support speech recognition.",
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (speechSynthesisRef.current && isSpeaking) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 rounded-full bg-primary hover:bg-primary-hover shadow-agriculture hover:shadow-xl transition-all duration-300 border-2 border-primary-foreground/20"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
          <div className="absolute -top-12 right-0 bg-popover text-popover-foreground px-3 py-1 rounded-lg shadow-md text-sm border opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
            AgriHub AI Assistant
          </div>
        </div>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <div className={`fixed right-6 z-50 bg-card border border-border rounded-lg shadow-agriculture transition-all duration-300 ${
          isMinimized 
            ? 'bottom-6 w-80 h-16' 
            : 'bottom-6 w-96 h-[600px]'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                <Bot className="w-4 h-4 text-success-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">AgriHub AI</h3>
                {!isMinimized && (
                  <p className="text-xs text-muted-foreground">
                    {isProcessing ? (language === 'telugu' ? 'ఆలోచిస్తున్నాను...' : 'Thinking...') : 
                     isSpeaking ? (language === 'telugu' ? 'మాట్లాడుతున్నాను...' : 'Speaking...') : 
                     (language === 'telugu' ? 'ఆన్‌లైన్' : 'Online')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-8 h-8 p-0 border-none">
                  <Languages className="w-4 h-4" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="telugu">తెలుగు</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="w-8 h-8 p-0"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-8 h-8 p-0"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4 h-[440px]">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!message.isUser && (
                        <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-success-foreground" />
                        </div>
                      )}
                      <div
                        className={`max-w-[280px] p-3 rounded-lg text-sm ${
                          message.isUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.text}</p>
                        <div className="flex items-center gap-1 mt-1 opacity-70">
                          <span className="text-xs">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {message.isVoice && <Mic className="w-3 h-3" />}
                        </div>
                      </div>
                      {message.isUser && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                        <Bot className="w-4 h-4 text-success-foreground" />
                      </div>
                      <div className="bg-muted text-muted-foreground p-3 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={language === 'telugu' 
                      ? "వ్యవసాయం, పంటలు, మట్టి, నీటిపారుদల గురించి అడుగండి..."
                      : "Ask about farming, crops, soil, irrigation..."
                    }
                    className="flex-1 agri-input"
                    disabled={isProcessing || isListening}
                  />
                  <Button
                    onClick={isListening ? stopListening : startListening}
                    disabled={isProcessing}
                    variant={isListening ? "destructive" : "outline"}
                    size="sm"
                    className="w-10 h-10 p-0"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <Button
                    onClick={() => handleSendMessage(inputText)}
                    disabled={!inputText.trim() || isProcessing}
                    className="w-10 h-10 p-0 agri-button-primary"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {language === 'telugu' 
                    ? "పంపడానికి Enter నొక్కండి • వాయిస్ ఇన్‌పుట్ కోసం మైక్ క్లిక్ చేయండి"
                    : "Press Enter to send • Click mic for voice input"
                  }
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AgriChatAgent;