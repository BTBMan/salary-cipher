import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

export interface PayrollSchedule {
  daysLeft: number
  canExecuteNow: boolean
  executeNowBlockedReason: string | null
  nextPayrollDate: string
  nextPayrollTimestamp: number
  periodProgress: number
}

export interface PayrollPeriod {
  periodEnd: number
  periodStart: number
}

function getPayrollDateForMonth(reference: dayjs.Dayjs, dayOfMonth: number) {
  const monthStart = reference.utc().date(1).startOf('day')
  const clampedDay = Math.min(dayOfMonth, monthStart.daysInMonth())
  return monthStart.date(clampedDay)
}

function getPreviousPayrollDate(payrollDate: dayjs.Dayjs, dayOfMonth: number) {
  return getPayrollDateForMonth(payrollDate.subtract(1, 'month'), dayOfMonth)
}

function getNextPayrollDate(payrollDate: dayjs.Dayjs, dayOfMonth: number) {
  return getPayrollDateForMonth(payrollDate.add(1, 'month'), dayOfMonth)
}

export function floorUtcDayTimestamp(timestamp: number) {
  return dayjs.unix(timestamp).utc().startOf('day').unix()
}

export function getPayrollSettlementPeriod(payrollTimestamp: number): PayrollPeriod {
  const payrollDate = dayjs.unix(payrollTimestamp).utc()
  const previousMonth = payrollDate.subtract(1, 'month')
  const periodStart = previousMonth.date(1).startOf('day')
  const periodEnd = previousMonth.date(previousMonth.daysInMonth()).startOf('day')

  return {
    periodEnd: periodEnd.unix(),
    periodStart: periodStart.unix(),
  }
}

export function getPayrollSchedule(
  dayOfMonth: number,
  lastPayrollTime = 0,
  companyCreatedAt = 0,
  referenceTimestamp = Math.floor(Date.now() / 1000),
): PayrollSchedule | null {
  if (!dayOfMonth) {
    return null
  }

  const todayStart = dayjs.unix(referenceTimestamp).utc().startOf('day')
  const currentMonthPayrollDate = getPayrollDateForMonth(todayStart, dayOfMonth)
  let nextPayrollDate = lastPayrollTime > 0
    ? getNextPayrollDate(dayjs.unix(lastPayrollTime).utc(), dayOfMonth)
    : currentMonthPayrollDate
  const companyStartDay = companyCreatedAt > 0 ? dayjs.unix(companyCreatedAt).utc().startOf('day') : null
  if (companyStartDay) {
    while (nextPayrollDate.isBefore(companyStartDay)) {
      nextPayrollDate = getNextPayrollDate(nextPayrollDate, dayOfMonth)
    }
  }

  const previousPayrollDate = getPreviousPayrollDate(nextPayrollDate, dayOfMonth)
  const previousCalendarMonthEnd = previousPayrollDate.date(previousPayrollDate.daysInMonth()).startOf('day')
  const totalDays = Math.max(nextPayrollDate.diff(previousPayrollDate, 'day'), 1)
  const elapsedDays = Math.min(Math.max(todayStart.diff(previousPayrollDate, 'day'), 0), totalDays)
  const canExecuteNow = todayStart.isAfter(previousCalendarMonthEnd)

  return {
    canExecuteNow,
    daysLeft: Math.max(nextPayrollDate.diff(todayStart, 'day'), 0),
    executeNowBlockedReason: canExecuteNow
      ? null
      : 'The current payroll period has not ended yet.',
    nextPayrollDate: nextPayrollDate.format('MMM DD, YYYY'),
    nextPayrollTimestamp: nextPayrollDate.unix(),
    periodProgress: Math.round((elapsedDays / totalDays) * 100),
  }
}
