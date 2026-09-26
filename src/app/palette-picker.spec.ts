import { BottomSheetEffects } from './app.component';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { PixelEffect } from './pixelator';

describe('Palette picker', () => {
    it('keeps original indices after filtering', () => {
        const dismiss = jasmine.createSpy('dismiss');
        const sheet = new BottomSheetEffects({ dismiss } as unknown as MatBottomSheetRef<BottomSheetEffects>, {
            effects: [{ title: 'Pastel' }, { title: 'Pocket Console' }, { title: 'Cosmo' }] as PixelEffect[], selected: 0
        });
        sheet.query = ' POCKET ';
        expect(sheet.filteredIndices).toEqual([1]);
        sheet.openLink(sheet.filteredIndices[0]);
        expect(dismiss).toHaveBeenCalledWith(1);
        sheet.query = 'nonexistent';
        expect(sheet.filteredIndices).toEqual([]);
    });
});
