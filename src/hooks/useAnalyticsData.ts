import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

export interface AnalyticsFilters {
  startDate: Date;
  endDate: Date;
  diagnosisFilter?: string;
  therapyFilter?: string;
}

export interface AnalyticsData {
  // Summary stats
  totalPatients: number;
  newPatients: number;
  totalVisits: number;
  totalScores: number;
  avgVisitsPerPatient: number;
  
  // Distributions
  diagnosisBreakdown: { name: string; count: number; percentage: number }[];
  therapyBreakdown: { name: string; count: number; percentage: number }[];
  scoreTypeBreakdown: { name: string; avgScore: number; count: number }[];
  
  // Trends over time
  visitTrend: { date: string; count: number }[];
  scoreTrend: { date: string; avgScore: number; count: number }[];
  patientGrowth: { date: string; cumulative: number; new: number }[];
  
  // Score details
  scoreDistribution: { range: string; count: number }[];
}

const defaultFilters: AnalyticsFilters = {
  startDate: subMonths(startOfMonth(new Date()), 2),
  endDate: endOfMonth(new Date()),
};

export function useAnalyticsData(initialFilters: AnalyticsFilters = defaultFilters) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableDiagnoses, setAvailableDiagnoses] = useState<string[]>([]);
  const [availableTherapies, setAvailableTherapies] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const startDateStr = format(filters.startDate, 'yyyy-MM-dd');
      const endDateStr = format(filters.endDate, 'yyyy-MM-dd');
      
      // Fetch patients
      const { data: patients } = await supabase
        .from('patient_cards_secure')
        .select('id, created_at, diagnosis_tags, therapy_tags')
        .eq('user_id', user.id);
      
      // Fetch visits in range
      const { data: visits } = await supabase
        .from('visits_secure')
        .select('id, visit_date, patient_card_id')
        .eq('user_id', user.id)
        .gte('visit_date', startDateStr)
        .lte('visit_date', endDateStr)
        .order('visit_date', { ascending: true });
      
      // Fetch scores in range
      const { data: scores } = await supabase
        .from('score_entries_secure')
        .select('id, score_type, calculated_score, created_at')
        .eq('user_id', user.id)
        .gte('created_at', filters.startDate.toISOString())
        .lte('created_at', filters.endDate.toISOString())
        .order('created_at', { ascending: true });
      
      if (!patients) {
        setData(null);
        setLoading(false);
        return;
      }
      
      // Filter patients by date range for new patients count
      const patientsInRange = patients.filter(p => {
        const created = new Date(p.created_at);
        return created >= filters.startDate && created <= filters.endDate;
      });
      
      // Apply diagnosis/therapy filters if set
      let filteredPatients = patients;
      if (filters.diagnosisFilter) {
        filteredPatients = filteredPatients.filter(p => 
          (p.diagnosis_tags || []).includes(filters.diagnosisFilter!)
        );
      }
      if (filters.therapyFilter) {
        filteredPatients = filteredPatients.filter(p => 
          (p.therapy_tags || []).includes(filters.therapyFilter!)
        );
      }
      
      const filteredPatientIds = new Set(filteredPatients.map(p => p.id));
      const filteredVisits = (visits || []).filter(v => filteredPatientIds.has(v.patient_card_id));
      
      // Calculate summary stats
      const totalPatients = filteredPatients.length;
      const newPatients = patientsInRange.filter(p => filteredPatientIds.has(p.id)).length;
      const totalVisits = filteredVisits.length;
      const totalScores = scores?.length || 0;
      const avgVisitsPerPatient = totalPatients > 0 ? Math.round((totalVisits / totalPatients) * 10) / 10 : 0;
      
      // Collect all diagnoses and therapies for filter dropdowns
      const allDiagnoses = new Set<string>();
      const allTherapies = new Set<string>();
      patients.forEach(p => {
        (p.diagnosis_tags || []).forEach((t: string) => allDiagnoses.add(t));
        (p.therapy_tags || []).forEach((t: string) => allTherapies.add(t));
      });
      setAvailableDiagnoses(Array.from(allDiagnoses).sort());
      setAvailableTherapies(Array.from(allTherapies).sort());
      
      // Diagnosis breakdown
      const diagnosisCounts: Record<string, number> = {};
      filteredPatients.forEach(p => {
        (p.diagnosis_tags || []).forEach((tag: string) => {
          diagnosisCounts[tag] = (diagnosisCounts[tag] || 0) + 1;
        });
      });
      const diagnosisBreakdown = Object.entries(diagnosisCounts)
        .map(([name, count]) => ({ 
          name, 
          count, 
          percentage: totalPatients > 0 ? Math.round((count / totalPatients) * 100) : 0 
        }))
        .sort((a, b) => b.count - a.count);
      
      // Therapy breakdown
      const therapyCounts: Record<string, number> = {};
      filteredPatients.forEach(p => {
        (p.therapy_tags || []).forEach((tag: string) => {
          therapyCounts[tag] = (therapyCounts[tag] || 0) + 1;
        });
      });
      const therapyBreakdown = Object.entries(therapyCounts)
        .map(([name, count]) => ({ 
          name, 
          count, 
          percentage: totalPatients > 0 ? Math.round((count / totalPatients) * 100) : 0 
        }))
        .sort((a, b) => b.count - a.count);
      
      // Score type breakdown
      const scoreSummary: Record<string, { total: number; count: number }> = {};
      (scores || []).forEach(s => {
        if (!scoreSummary[s.score_type]) {
          scoreSummary[s.score_type] = { total: 0, count: 0 };
        }
        scoreSummary[s.score_type].total += s.calculated_score || 0;
        scoreSummary[s.score_type].count += 1;
      });
      const scoreTypeBreakdown = Object.entries(scoreSummary)
        .map(([name, { total, count }]) => ({
          name,
          avgScore: Math.round((total / count) * 10) / 10,
          count,
        }))
        .sort((a, b) => b.count - a.count);
      
      // Visit trend (group by week or month depending on range)
      const daysDiff = Math.ceil((filters.endDate.getTime() - filters.startDate.getTime()) / (1000 * 60 * 60 * 24));
      const visitsByDate: Record<string, number> = {};
      
      if (daysDiff <= 31) {
        // Daily for short ranges
        eachDayOfInterval({ start: filters.startDate, end: filters.endDate }).forEach(date => {
          visitsByDate[format(date, 'yyyy-MM-dd')] = 0;
        });
        filteredVisits.forEach(v => {
          const dateKey = v.visit_date;
          if (visitsByDate[dateKey] !== undefined) {
            visitsByDate[dateKey]++;
          }
        });
      } else if (daysDiff <= 90) {
        // Weekly for medium ranges
        eachWeekOfInterval({ start: filters.startDate, end: filters.endDate }).forEach(date => {
          visitsByDate[format(date, 'yyyy-MM-dd')] = 0;
        });
        filteredVisits.forEach(v => {
          const visitDate = new Date(v.visit_date);
          const weekStart = eachWeekOfInterval({ start: filters.startDate, end: filters.endDate })
            .reverse()
            .find(w => visitDate >= w);
          if (weekStart) {
            const key = format(weekStart, 'yyyy-MM-dd');
            visitsByDate[key] = (visitsByDate[key] || 0) + 1;
          }
        });
      } else {
        // Monthly for long ranges
        eachMonthOfInterval({ start: filters.startDate, end: filters.endDate }).forEach(date => {
          visitsByDate[format(date, 'yyyy-MM')] = 0;
        });
        filteredVisits.forEach(v => {
          const key = v.visit_date.substring(0, 7);
          if (visitsByDate[key] !== undefined) {
            visitsByDate[key]++;
          }
        });
      }
      
      const visitTrend = Object.entries(visitsByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      // Score trend (monthly average)
      const scoresByMonth: Record<string, { total: number; count: number }> = {};
      (scores || []).forEach(s => {
        const month = s.created_at.substring(0, 7);
        if (!scoresByMonth[month]) {
          scoresByMonth[month] = { total: 0, count: 0 };
        }
        scoresByMonth[month].total += s.calculated_score || 0;
        scoresByMonth[month].count++;
      });
      const scoreTrend = Object.entries(scoresByMonth)
        .map(([date, { total, count }]) => ({
          date,
          avgScore: Math.round((total / count) * 10) / 10,
          count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      // Patient growth
      const patientsByMonth: Record<string, number> = {};
      patients.forEach(p => {
        const month = p.created_at.substring(0, 7);
        patientsByMonth[month] = (patientsByMonth[month] || 0) + 1;
      });
      let cumulative = 0;
      const patientGrowth = Object.entries(patientsByMonth)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, newCount]) => {
          cumulative += newCount;
          return { date, cumulative, new: newCount };
        });
      
      // Score distribution
      const scoreRanges = [
        { range: '0-2', min: 0, max: 2 },
        { range: '2-4', min: 2, max: 4 },
        { range: '4-6', min: 4, max: 6 },
        { range: '6-8', min: 6, max: 8 },
        { range: '8+', min: 8, max: Infinity },
      ];
      const scoreDistribution = scoreRanges.map(({ range, min, max }) => ({
        range,
        count: (scores || []).filter(s => 
          (s.calculated_score || 0) >= min && (s.calculated_score || 0) < max
        ).length,
      }));
      
      setData({
        totalPatients,
        newPatients,
        totalVisits,
        totalScores,
        avgVisitsPerPatient,
        diagnosisBreakdown,
        therapyBreakdown,
        scoreTypeBreakdown,
        visitTrend,
        scoreTrend,
        patientGrowth,
        scoreDistribution,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    filters,
    setFilters,
    availableDiagnoses,
    availableTherapies,
    refetch: fetchData,
  };
}
