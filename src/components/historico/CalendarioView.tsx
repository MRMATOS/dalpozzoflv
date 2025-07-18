
import React, { useEffect, useRef } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { EventoCalendario } from '@/hooks/useHistoricoConsolidado';
import { Card, CardContent } from '@/components/ui/card';

// Configurar moment para português
moment.locale('pt-br');
const localizer = momentLocalizer(moment);

interface CalendarioViewProps {
  eventos: EventoCalendario[];
  onEventClick?: (evento: EventoCalendario) => void;
  currentView?: string;
  onViewChange?: (view: string) => void;
}

const CalendarioView: React.FC<CalendarioViewProps> = ({ eventos, onEventClick, currentView, onViewChange }) => {
  const calendarRef = useRef<any>(null);

  // PARTE 2: Auto-scroll melhorado para vistas temporais
  useEffect(() => {
    if (eventos.length > 0 && (currentView === Views.DAY || currentView === Views.WEEK)) {
      const hoje = new Date();
      const ontem = new Date(hoje.getTime() - 24 * 60 * 60 * 1000);
      
      // Encontrar primeiro evento relevante (hoje ou futuro)
      const eventoRelevante = eventos
        .filter(evento => evento.start.getTime() >= ontem.getTime())
        .sort((a, b) => a.start.getTime() - b.start.getTime())[0];

      if (eventoRelevante) {
        setTimeout(() => {
          const targetHour = Math.max(8, eventoRelevante.start.getHours() - 1); // Scroll 1h antes, mínimo 8h
          
          // Buscar elemento de tempo no calendário
          const timeElements = document.querySelectorAll('.rbc-time-slot, .rbc-day-slot, [data-time]');
          
          for (let element of timeElements) {
            const elementText = element.textContent || '';
            if (elementText.includes(`${targetHour}:00`) || elementText.includes(`${targetHour.toString().padStart(2, '0')}:`)) {
              element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
              });
              break;
            }
          }
        }, 800); // Delay maior para garantir renderização
      }
    }
  }, [eventos, currentView]);
  const handleSelectEvent = (event: EventoCalendario) => {
    if (onEventClick) {
      onEventClick(event);
    }
  };

  const handleViewChange = (view: string) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  const EventComponent = ({ event }: { event: EventoCalendario }) => {
    const fornecedores = event.resource.fornecedores || [];
    
    // PARTE 2: Personalizar exibição conforme a vista
    const getTituloPersonalizado = () => {
      if (currentView === Views.MONTH) {
        // Vista Mensal: Máximo 2 fornecedores + contador
        if (fornecedores.length <= 2) {
          return fornecedores.join(', ');
        } else {
          return `${fornecedores.slice(0, 2).join(', ')} e mais ${fornecedores.length - 2}`;
        }
      } else if (currentView === Views.WEEK) {
        // Vista Semanal: Fornecedores compactos sem horário
        if (fornecedores.length <= 3) {
          return fornecedores.join(', ');
        } else {
          return `${fornecedores.slice(0, 2).join(', ')}... +${fornecedores.length - 2}`;
        }
      } else {
        // Vista Diária: Máximo espaço para fornecedores
        if (fornecedores.length <= 4) {
          return fornecedores.join(', ');
        } else {
          return `${fornecedores.slice(0, 3).join(', ')} e mais ${fornecedores.length - 3}`;
        }
      }
    };

    return (
      <div className="text-xs p-1 bg-primary text-primary-foreground rounded overflow-hidden h-full">
        <div className="font-medium truncate text-[10px] leading-tight">
          {getTituloPersonalizado()}
        </div>
        <div className="text-[9px] opacity-90 truncate">
          {event.resource.totalItens} itens
        </div>
      </div>
    );
  };

  const eventStyleGetter = (event: EventoCalendario) => {
    const { tipos, totalValor } = event.resource;
    
    // Cores baseadas no tipo de pedido predominante
    let backgroundColor = '#3b82f6'; // azul padrão
    
    if (tipos.includes('cotacao') && tipos.includes('simples')) {
      backgroundColor = '#8b5cf6'; // roxo para misto
    } else if (tipos.includes('cotacao')) {
      backgroundColor = '#3b82f6'; // azul para cotação
    } else if (tipos.includes('simples')) {
      backgroundColor = '#10b981'; // verde para simples
    }

    // Intensidade baseada no valor total
    const opacity = Math.min(0.7 + (totalValor / 1000) * 0.3, 1);

    return {
      style: {
        backgroundColor,
        opacity,
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        padding: '2px 4px',
        fontSize: '11px'
      }
    };
  };

  const messages = {
    allDay: 'Dia todo',
    previous: 'Anterior',
    next: 'Próximo',
    today: 'Hoje',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    agenda: 'Agenda',
    date: 'Data',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'Nenhum pedido encontrado neste período',
    showMore: (total: number) => `+${total} mais`
  };

  return (
    <Card className="h-[600px]">
      <CardContent className="p-4 h-full">
        <div className="h-full">
          <Calendar
            localizer={localizer}
            events={eventos}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            components={{
              event: EventComponent
            }}
            messages={messages}
            defaultView={Views.MONTH}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            onView={handleViewChange}
            popup
            popupOffset={{ x: 10, y: 10 }}
            className="react-big-calendar-custom"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarioView;
