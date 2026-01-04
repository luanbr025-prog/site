import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Calendar, MapPin, Users, Trophy, Share, Thermometer, Wind, Droplet, 
  Gauge, Flag, Clock, Car, Timer, ChevronDown, ChevronUp, Server, BarChart2, 
  Settings, Target, Play, Pause, FastForward, Rewind, Download, Eye, EyeOff, 
  Volume2, VolumeX, Maximize, Minimize, GitCompare, TrendingUp, TrendingDown, 
  AlertCircle, CheckCircle2, XCircle, Info, HelpCircle, LayoutGrid, LayoutList, 
  SlidersHorizontal, Award, Medal, Star, Heart, MessageCircle, Bookmark, 
  MoreHorizontal, ChevronRight, ChevronLeft, RefreshCw, AlertTriangle
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Race {
  id: number;
  title: string;
  track: string;
  date: string;
  time: string;
  description: string;
  image: string;
  laps: string;
  duration: string;
  pilots: number;
  participants: { username: string; registeredAt: string }[];
  championship?: string;
  trackTemp?: string;
  airTemp?: string;
  windSpeed?: string;
  windDirection?: string;
  fuelRecommendation?: string;
  status?: string;
  serverIp?: string;
  serverPort?: string;
  maxParticipants?: string;
  category?: string;
  prize?: string;
  requirement?: string;
  createdAt?: string;
  udpListenAddress?: string;
  udpSendAddress?: string;
  udpEnabled?: boolean;
  udpRefreshInterval?: number;
}



const RaceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Estado da corrida
  const [race, setRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);

  // Estado de UI
  const [activeTab, setActiveTab] = useState("timing");
  const [fullscreen, setFullscreen] = useState(false);
  const [showMap, setShowMap] = useState(true);

  // Refs
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const timingTableRef = useRef<HTMLDivElement>(null);

  // Carregar dados da corrida
  useEffect(() => {
    fetch('/api/races')
      .then(res => res.json())
      .then(data => {
        const foundRace = data.find((r: Race) => r.id === Number(id));
        setRace(foundRace || null);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar corrida:', err);
        setLoading(false);
      });
  }, [id]);



  // Verificar se é um usuário registrado
  useEffect(() => {
    if (race) {
      fetch('/api/session')
        .then(res => res.json())
        .then(session => {
          if (session.user) {
            setIsRegistered(race.participants.some(p => p.username === session.user.username));
          }
        })
        .catch(err => console.error('Erro ao verificar sessão:', err));
    }
  }, [race]);

  // Cores para posições
  const getPositionColor = (position: number) => {
    if (position === 1) return 'text-yellow-400';
    if (position === 2) return 'text-gray-300';
    if (position === 3) return 'text-amber-600';
    return 'text-foreground';
  };

  const getStatusColor = (status?: string) => {
    if (status === 'live') return 'bg-red-500 animate-pulse';
    if (status === 'completed') return 'bg-green-500';
    return 'bg-blue-500';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
  };

  const handleRegister = async () => {
    if (!race) return;
    setRegistering(true);
    try {
      const response = await fetch(`/api/races/${race.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (result.ok) {
        setIsRegistered(true);
      } else {
        alert(result.message || 'Erro ao se inscrever');
      }
    } catch (error) {
      console.error('Erro ao inscrever:', error);
      alert('Erro ao se inscrever');
    }
    setRegistering(false);
  };

  const toggleFullscreen = () => {
    const element = mainContainerRef.current;
    if (!element) return;

    if (!fullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen().catch(err => {
          console.error('Erro ao ativar fullscreen:', err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setFullscreen(!fullscreen);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!race) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Corrida não encontrada</h1>
            <Button onClick={() => navigate('/races')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para corridas
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Botão Voltar */}
        <Button
          variant="ghost"
          onClick={() => navigate('/races')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para corridas
        </Button>

        {/* Cabeçalho da Corrida */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4 gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{race.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {race.track}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(race.date).toLocaleDateString('pt-BR')} às {race.time}
                </div>
                <Badge className={getStatusColor(race.status)}>
                  {race.status === 'live' ? 'AO VIVO' : race.status === 'completed' ? 'Finalizado' : 'Próxima'}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleRegister}
                disabled={isRegistered || registering}
              >
                {isRegistered ? 'Inscrito ✓' : registering ? 'Inscrevendo...' : 'Inscrever-se'}
              </Button>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="grid lg:grid-cols-4 gap-8" ref={mainContainerRef}>
          {/* Seção de Live Timing e Track Map */}
          <div className="lg:col-span-3">
            <Card className="glass-card gradient-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Timer className="h-6 w-6" />
                  Live Timing & Pista
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowMap(!showMap)}>
                    {showMap ? 'Ocultar Pista' : 'Mostrar Pista'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                    {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Abas */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="timing">Inscritos</TabsTrigger>
                    <TabsTrigger value="map">Detalhes</TabsTrigger>
                  </TabsList>

                  {/* Aba Classificação */}
                  <TabsContent value="timing" className="space-y-4">
                    {race && race.participants && race.participants.length > 0 ? (
                      <>
                        {/* Estatísticas */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-lg">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Total de Inscritos</div>
                            <div className="text-lg font-bold text-primary">{race.participants.length}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Máximo de Pilotos</div>
                            <div className="text-lg font-bold text-secondary">{race.pilots}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Voltas</div>
                            <div className="text-lg font-bold text-green-500">{race.laps}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Duração</div>
                            <div className="text-lg font-bold text-orange-500">{race.duration}</div>
                          </div>
                        </div>

                        {/* Tabela de Inscritos */}
                        <div className="overflow-x-auto rounded-lg border" ref={timingTableRef}>
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="p-2 text-left">Pos</th>
                                <th className="p-2 text-left">Piloto</th>
                                <th className="p-2 text-left">Data de Inscrição</th>
                              </tr>
                            </thead>
                            <tbody>
                              {race.participants.map((participant, idx) => (
                                <tr
                                  key={idx}
                                  className="border-b hover:bg-muted/20 transition-colors"
                                >
                                  <td className="p-2 font-bold text-primary">{idx + 1}</td>
                                  <td className="p-2 font-medium">{participant.username}</td>
                                  <td className="p-2 text-muted-foreground">
                                    {new Date(participant.registeredAt).toLocaleDateString('pt-BR')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                        Nenhum participante inscrito ainda
                      </div>
                    )}
                  </TabsContent>

                  {/* Aba Detalhes */}
                  <TabsContent value="map">
                    {race && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted/30 p-4 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Pista</div>
                            <div className="text-lg font-bold">{race.track}</div>
                          </div>
                          <div className="bg-muted/30 p-4 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Categoria</div>
                            <div className="text-lg font-bold">{race.category || 'N/A'}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted/30 p-4 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Horário</div>
                            <div className="text-lg font-bold">{race.time}</div>
                          </div>
                          <div className="bg-muted/30 p-4 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Duração</div>
                            <div className="text-lg font-bold">{race.duration}</div>
                          </div>
                        </div>

                        <div className="bg-muted/30 p-4 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-2">Descrição</div>
                          <p className="text-sm leading-relaxed">{race.description}</p>
                        </div>

                        {race.requirement && (
                          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              Requisito
                            </div>
                            <p className="text-sm">{race.requirement}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Painel Lateral */}
          <div className="lg:col-span-1 space-y-4">
            {/* Informações da Corrida */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalhes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground">Categoria</div>
                  <div className="font-semibold">{race.category || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Voltas</div>
                  <div className="font-semibold">{race.laps}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Duração</div>
                  <div className="font-semibold">{race.duration}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Participantes</div>
                  <div className="font-semibold">{race.participants.length}/{race.maxParticipants || 20}</div>
                </div>
              </CardContent>
            </Card>

            {/* Condições Climáticas */}
            {race.trackTemp && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Clima</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    <div>
                      <div className="text-xs text-muted-foreground">Pista</div>
                      <div className="font-semibold">{race.trackTemp}°C</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    <div>
                      <div className="text-xs text-muted-foreground">Ar</div>
                      <div className="font-semibold">{race.airTemp}°C</div>
                    </div>
                  </div>
                  {race.windSpeed && (
                    <div className="flex items-center gap-2">
                      <Wind className="h-4 w-4" />
                      <div>
                        <div className="text-xs text-muted-foreground">Vento</div>
                        <div className="font-semibold">{race.windSpeed} km/h</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Descrição */}
            {race.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{race.description}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RaceDetail;
