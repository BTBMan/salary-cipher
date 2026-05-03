import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

export interface PayrollSchedule {
  daysLeft: number
  nextPayrollDate: string
  nextPayrollTimestamp: number
  periodProgress: number
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

export function getPayrollSchedule(dayOfMonth: number, lastPayrollTime = 0, companyCreatedAt = 0): PayrollSchedule | null {
  if (!dayOfMonth) {
    return null
  }

  const todayStart = dayjs.utc().startOf('day')
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
  const totalDays = Math.max(nextPayrollDate.diff(previousPayrollDate, 'day'), 1)
  const elapsedDays = Math.min(Math.max(todayStart.diff(previousPayrollDate, 'day'), 0), totalDays)

  return {
    daysLeft: Math.max(nextPayrollDate.diff(todayStart, 'day'), 0),
    nextPayrollDate: nextPayrollDate.format('MMM DD, YYYY'),
    nextPayrollTimestamp: nextPayrollDate.unix(),
    periodProgress: Math.round((elapsedDays / totalDays) * 100),
  }
}
