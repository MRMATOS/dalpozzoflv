
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

  // FUNCIONALIDADE: Auto-scroll para primeiro pedido nas vistas diária e semanal
  useEffect(() => {
    if (eventos.length > 0 && (currentView === Views.DAY || currentView === Views.WEEK)) {
      // Encontrar o primeiro pedido do dia/semana
      const primeiroEvento = eventos
        .filter(evento => evento.start.getTime() >= Date.now() - 24 * 60 * 60 * 1000) // eventos de hoje em diante
        .sort((a, b) => a.start.getTime() - b.start.getTime())[0];

      if (primeiroEvento) {
        setTimeout(() => {
          // Scroll para o horário do primeiro pedido
          const timeSlots = document.querySelectorAll('.rbc-time-slot');
          const targetHour = primeiroEvento.start.getHours();
          
          // Encontrar o slot de tempo correspondente ao horário do pedido
          const targetSlot = Array.from(timeSlots).find((slot: any) => {
            const slotTime = slot.getAttribute('data-time');
            if (slotTime) {
              const slotHour = parseInt(slotTime.split(':')[0]);
              return slotHour >= targetHour - 1; // Scroll um pouco antes
            }
            return false;
          });

          if (targetSlot) {
            targetSlot.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
          }
        }, 500); // Delay para garantir que o calendário foi renderizado
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
    // PARTE 2: Exibir fornecedores consolidados no card
    const fornecedores = event.resource.fornecedores || [];
    const dataEvento = event.start.toISOString().split('T')[0];
    const pedidosMesmoDia = eventos.filter(e => 
      e.start.toISOString().split('T')[0] === dataEvento
    );
    
    return (
      <div className="p-1 text-white">
        <div className="text-xs font-medium">
          {event.resource.fornecedores[0]}
        </div>
        <div className="text-xs opacity-80">
          R$ {event.resource.totalValor.toFixed(2)}
        </div>
        {pedidosMesmoDia.length > 1 && (
          <div className="text-xs opacity-70">
            +{pedidosMesmoDia.length - 1} mais
          </div>
        )}
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
