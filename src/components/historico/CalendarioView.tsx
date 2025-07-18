
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, DollarSign, Package } from 'lucide-react';
import { EventoCalendario } from '@/hooks/useHistoricoConsolidado';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

interface CalendarioViewProps {
  eventos: EventoCalendario[];
  onEventClick: (evento: EventoCalendario) => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

const CalendarioView: React.FC<CalendarioViewProps> = ({ 
  eventos, 
  onEventClick, 
  currentView,
  onViewChange 
}) => {
  const [date, setDate] = useState(new Date());
  const calendarRef = useRef<any>(null);

  // CORREÇÃO CRÍTICA: Auto-scroll mais preciso e confiável
  useEffect(() => {
    if ((currentView === 'week' || currentView === 'day') && eventos.length > 0) {
      const timeoutId = setTimeout(() => {
        const calendar = document.querySelector('.rbc-time-view');
        if (!calendar) {
          console.log('[AUTO-SCROLL] Calendário não encontrado, tentando novamente...');
          return;
        }

        // Encontrar eventos visíveis na data/semana atual
        const currentDate = new Date(date);
        const eventosVisiveis = eventos.filter(evento => {
          const eventoDate = new Date(evento.start);
          
          if (currentView === 'day') {
            return eventoDate.toDateString() === currentDate.toDateString();
          } else {
            // Para semana, verificar se está na semana atual
            const inicioSemana = moment(currentDate).startOf('week').toDate();
            const fimSemana = moment(currentDate).endOf('week').toDate();
            return eventoDate >= inicioSemana && eventoDate <= fimSemana;
          }
        });

        console.log(`[AUTO-SCROLL] Encontrados ${eventosVisiveis.length} eventos visíveis`);

        if (eventosVisiveis.length > 0) {
          // Ordenar por horário e pegar o primeiro evento
          const primeiroEvento = eventosVisiveis.sort((a, b) => 
            a.start.getTime() - b.start.getTime()
          )[0];

          const horarioEvento = primeiroEvento.start.getHours();
          const minutosEvento = primeiroEvento.start.getMinutes();
          
          // CORREÇÃO: Scroll para 1 hora antes do primeiro evento, mas não antes das 6h
          const horarioAlvo = Math.max(6, horarioEvento - 1);
          
          // CORREÇÃO CRÍTICA: Cálculo mais preciso baseado na altura real do calendário
          const timeSlotHeight = 60; // Altura padrão de cada hora no BigCalendar
          const scrollPosition = horarioAlvo * timeSlotHeight;
          
          console.log(`[AUTO-SCROLL] Fazendo scroll para ${horarioAlvo}:00 (primeiro evento às ${horarioEvento}:${minutosEvento.toString().padStart(2, '0')})`);
          
          calendar.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        } else {
          // Se não há eventos visíveis, scroll para 6h (horário inicial)
          const scrollPosition = 6 * 60;
          calendar.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
          console.log('[AUTO-SCROLL] Nenhum evento visível, scroll para 6:00');
        }
      }, 700); // Aumentar timeout para garantir renderização completa

      return () => clearTimeout(timeoutId);
    }
  }, [currentView, date, eventos]);

  // CORREÇÃO CRÍTICA: Componente de evento mais limpo e compacto
  const EventComponent = ({ event }: { event: EventoCalendario }) => {
    const { resource } = event;
    const isMonthView = currentView === 'month';
    
    return (
      <div 
        className={`p-1 rounded-sm bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors ${
          isMonthView ? 'text-xs' : 'text-xs'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onEventClick(event);
        }}
        title={`${event.title} - ${resource.totalItens} itens - R$ ${resource.totalValor.toFixed(2)}`}
      >
        <div className="space-y-0.5">
          {/* CORREÇÃO: Título mais limpo - apenas fornecedores */}
          <div className={`font-medium truncate leading-tight ${isMonthView ? 'text-xs' : 'text-xs'}`}>
            {event.title}
          </div>
          
          {/* CORREÇÃO: Informações compactas apenas para views maiores */}
          {!isMonthView && (
            <div className="flex items-center gap-1 text-xs opacity-90">
              <span className="flex items-center gap-0.5">
                <Package className="h-2 w-2" />
                {resource.totalItens}
              </span>
              {resource.totalValor > 0 && (
                <span className="flex items-center gap-0.5">
                  <DollarSign className="h-2 w-2" />
                  {resource.totalValor > 1000 
                    ? `R$ ${(resource.totalValor / 1000).toFixed(1)}k` 
                    : `R$ ${resource.totalValor.toFixed(0)}`
                  }
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
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
    noEventsInRange: 'Não há eventos no período selecionado.',
    showMore: (total: number) => `+ ${total}`
  };

  const handleViewChange = (view: View) => {
    const viewString = view.toString();
    onViewChange(viewString);
  };

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  return (
    <div className="space-y-4">
      {/* Estatísticas do período visível */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <div>
                <div className="font-medium">{eventos.length}</div>
                <div className="text-muted-foreground">Dias com pedidos</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <div>
                <div className="font-medium">
                  {eventos.reduce((sum, e) => sum + e.resource.pedidos.length, 0)}
                </div>
                <div className="text-muted-foreground">Total de pedidos</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-600" />
              <div>
                <div className="font-medium">
                  {eventos.reduce((sum, e) => sum + e.resource.totalItens, 0)}
                </div>
                <div className="text-muted-foreground">Itens totais</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <div className="font-medium">
                  R$ {eventos.reduce((sum, e) => sum + e.resource.totalValor, 0).toFixed(0)}
                </div>
                <div className="text-muted-foreground">Valor total</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendário */}
      <Card>
        <CardContent className="p-0">
          <div className="calendar-container" style={{ height: currentView === 'month' ? 600 : 700 }}>
            <Calendar
              ref={calendarRef}
              localizer={localizer}
              events={eventos}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectEvent={onEventClick}
              onView={handleViewChange}
              onNavigate={handleNavigate}
              view={currentView as View}
              date={date}
              messages={messages}
              components={{
                event: EventComponent,
              }}
              formats={{
                timeGutterFormat: 'HH:mm',
                eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                  localizer?.format(start, 'HH:mm', culture) + ' - ' + localizer?.format(end, 'HH:mm', culture),
                dayFormat: (date, culture, localizer) =>
                  localizer?.format(date, 'DD/MM', culture) || '',
                dayHeaderFormat: (date, culture, localizer) =>
                  localizer?.format(date, 'dddd DD/MM', culture) || '',
                monthHeaderFormat: (date, culture, localizer) =>
                  localizer?.format(date, 'MMMM YYYY', culture) || '',
              }}
              min={new Date(0, 0, 0, 6, 0, 0)} // 6:00 AM
              max={new Date(0, 0, 0, 22, 0, 0)} // 10:00 PM
              step={60}
              timeslots={1}
              popup={false}
              selectable={false}
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              eventPropGetter={() => ({
                style: {
                  backgroundColor: 'hsl(var(--primary))',
                  borderRadius: '4px',
                  border: 'none',
                  color: 'hsl(var(--primary-foreground))',
                  fontSize: '11px',
                  padding: '2px 4px'
                }
              })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarioView;
