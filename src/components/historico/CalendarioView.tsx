
import React from 'react';
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
}

const CalendarioView: React.FC<CalendarioViewProps> = ({ eventos, onEventClick }) => {
  const handleSelectEvent = (event: EventoCalendario) => {
    if (onEventClick) {
      onEventClick(event);
    }
  };

  const EventComponent = ({ event }: { event: EventoCalendario }) => (
    <div className="p-1 text-white">
      <div className="text-xs font-medium">
        {event.resource.pedidos.length} pedidos
      </div>
      <div className="text-xs opacity-80">
        R$ {event.resource.totalValor.toFixed(2)}
      </div>
    </div>
  );

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
