import { render, screen } from '@testing-library/react-native';

import { SummaryRow } from './summary-row';

describe('SummaryRow', () => {
  it('renders the title and value', async () => {
    await render(<SummaryRow title="Compte courant" value="12 000 Ar" />);
    expect(screen.getByText('Compte courant')).toBeTruthy();
    expect(screen.getByText('12 000 Ar')).toBeTruthy();
  });

  it('renders the subtitle only when provided', async () => {
    await render(<SummaryRow title="Compte courant" subtitle="Banque" value="12 000 Ar" />);
    expect(screen.getByText('Banque')).toBeTruthy();
  });

  it('omits the subtitle text when none is passed', async () => {
    await render(<SummaryRow title="Compte courant" value="12 000 Ar" />);
    expect(screen.queryByText('Banque')).toBeNull();
  });
});
