
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

  // CORREÇÃO: Auto-scroll melhorado para semana e dia
  useEffect(() => {
    if ((currentView === 'week' || currentView === 'day') && eventos.length > 0) {
      setTimeout(() => {
        const calendar = document.querySelector('.rbc-time-view');
        if (calendar) {
          // Encontrar o primeiro evento do dia/semana visível
          const eventosVisiveis = eventos.filter(evento => {
            if (currentView === 'day') {
              return evento.start.toDateString() === date.toDateString();
            } else {
              // Para semana, verificar se está na semana atual
              const inicioSemana = moment(date).startOf('week').toDate();
              const fimSemana = moment(date).endOf('week').toDate();
              return evento.start >= inicioSemana && evento.start <= fimSemana;
            }
          });

          if (eventosVisiveis.length > 0) {
            // Ordenar por horário e pegar o primeiro
            const primeiroEvento = eventosVisiveis.sort((a, b) => 
              a.start.getTime() - b.start.getTime()
            )[0];

            // Calcular horário alvo (1 hora antes do primeiro evento, mas não antes das 6h)
            const horarioEvento = primeiroEvento.start.getHours();
            const horarioAlvo = Math.max(6, horarioEvento - 1);
            
            // Scroll para o horário calculado
            const pixelsPorHora = 60; // Aproximadamente 60px por hora no calendário
            const scrollPosition = horarioAlvo * pixelsPorHora;
            
            calendar.scrollTo({
              top: scrollPosition,
              behavior: 'smooth'
            });

            console.log(`Auto-scroll para ${horarioAlvo}:00 (evento às ${horarioEvento}:00)`);
          } else {
            // Se não há eventos visíveis, scroll para 8h (horário comercial)
            const scrollPosition = 8 * 60;
            calendar.scrollTo({
              top: scrollPosition,
              behavior: 'smooth'
            });
          }
        }
      }, 500); // Aguardar renderização do calendário
    }
  }, [currentView, date, eventos]);

  // Componente de evento customizado
  const EventComponent = ({ event }: { event: EventoCalendario }) => {
    const { resource } = event;
    
    // Diferentes tamanhos baseados na view
    const isMonthView = currentView === 'month';
    const isDayView = currentView === 'day';
    
    return (
      <div 
        className={`p-2 rounded-lg bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors ${
          isMonthView ? 'text-xs' : isDayView ? 'text-sm' : 'text-xs'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onEventClick(event);
        }}
      >
        <div className="space-y-1">
          {/* Linha 1: Fornecedores (título do evento) */}
          <div className={`font-medium truncate ${isMonthView ? 'text-xs' : 'text-sm'}`}>
            {event.title}
          </div>
          
          {/* Linha 2: Informações resumidas - mostrar baseado no espaço disponível */}
          {!isMonthView && (
            <div className="flex items-center gap-2 text-xs opacity-90">
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span>{resource.totalItens}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span>R$ {resource.totalValor.toFixed(0)}</span>
              </div>
            </div>
          )}
          
          {/* Linha 3: Badges de tipos (apenas em day view) */}
          {isDayView && (
            <div className="flex gap-1">
              {resource.tipos.map((tipo, index) => (
                <Badge 
                  key={index}
                  variant={tipo === 'cotacao' ? 'secondary' : 'outline'}
                  className="text-xs px-1 py-0 h-4"
                >
                  {tipo === 'cotacao' ? 'Cot' : 'Sim'}
                </Badge>
              ))}
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
    showMore: (total: number) => `+ mais ${total}`
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
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarioView;
