'use strict';

var expect = require('chai').expect;

var Bluebird = require('bluebird');
var _ = require('underscore');
var Row = require('../../lib/doc/row');
var Column = require('../../lib/doc/column');
var Excel = require('../../excel');
var tools = require('./tools');

var dataValidations = require('./test-data-validation-sheet');

var utils = module.exports = {
  testValues: tools.fix(require('./test-values.json')),
  styles: tools.fix(require('./test-styles.json')),
  properties: tools.fix(require('./sheet-properties.json')),
  pageSetup: tools.fix(require('./page-setup.json')),

  dataValidations: {
    addSheet: dataValidations.addDataValidationSheet,
    checkSheet: dataValidations.checkDataValidationSheet
  },

  createTestBook: function(checkBadAlignments, WorkbookClass, options) {
    var wb = new WorkbookClass(options);

    wb.views = [
      {x: 1, y: 2, width: 10000, height: 20000, firstSheet: 0, activeTab: 0}
    ];

    var ws = wb.addWorksheet('blort', {
      properties: utils.properties,
      pageSetup:  utils.pageSetup
    });

    ws.getCell('J10').value = 1;
    ws.getColumn(10).outlineLevel = 1;
    ws.getRow(10).outlineLevel = 1;

    ws.getCell('A1').value = 7;
    ws.getCell('B1').value = utils.testValues.str;
    ws.getCell('C1').value = utils.testValues.date;
    ws.getCell('D1').value = utils.testValues.formulas[0];
    ws.getCell('E1').value = utils.testValues.formulas[1];
    ws.getCell('F1').value = utils.testValues.hyperlink;
    ws.getCell('G1').value = utils.testValues.str2;
    ws.getRow(1).commit();

    // merge cell square with numerical value
    ws.getCell('A2').value = 5;
    ws.mergeCells('A2:B3');

    // merge cell square with null value
    ws.mergeCells('C2:D3');
    ws.getRow(3).commit();

    ws.getCell('A4').value = 1.5;
    ws.getCell('A4').numFmt = utils.testValues.numFmt1;
    ws.getCell('A4').border = utils.styles.borders.thin;
    ws.getCell('C4').value = 1.5;
    ws.getCell('C4').numFmt = utils.testValues.numFmt2;
    ws.getCell('C4').border = utils.styles.borders.doubleRed;
    ws.getCell('E4').value = 1.5;
    ws.getCell('E4').border = utils.styles.borders.thickRainbow;
    ws.getRow(4).commit();

    // test fonts and formats
    ws.getCell('A5').value = utils.testValues.str;
    ws.getCell('A5').font = utils.styles.fonts.arialBlackUI14;
    ws.getCell('B5').value = utils.testValues.str;
    ws.getCell('B5').font = utils.styles.fonts.broadwayRedOutline20;
    ws.getCell('C5').value = utils.testValues.str;
    ws.getCell('C5').font = utils.styles.fonts.comicSansUdB16;

    ws.getCell('D5').value = 1.6;
    ws.getCell('D5').numFmt = utils.testValues.numFmt1;
    ws.getCell('D5').font = utils.styles.fonts.arialBlackUI14;

    ws.getCell('E5').value = 1.6;
    ws.getCell('E5').numFmt = utils.testValues.numFmt2;
    ws.getCell('E5').font = utils.styles.fonts.broadwayRedOutline20;

    ws.getCell('F5').value = utils.testValues.date;
    ws.getCell('F5').numFmt = utils.testValues.numFmtDate;
    ws.getCell('F5').font = utils.styles.fonts.comicSansUdB16;
    ws.getRow(5).commit();

    ws.getRow(6).height = 42;
    _.each(utils.styles.alignments, function(alignment, index) {
      var rowNumber = 6;
      var colNumber = index + 1;
      var cell = ws.getCell(rowNumber, colNumber);
      cell.value = alignment.text;
      cell.alignment = alignment.alignment;
    });
    ws.getRow(6).commit();

    if (checkBadAlignments) {
      _.each(utils.styles.badAlignments, function(alignment, index) {
        var rowNumber = 7;
        var colNumber = index + 1;
        var cell = ws.getCell(rowNumber, colNumber);
        cell.value = alignment.text;
        cell.alignment = alignment.alignment;
      });
    }
    ws.getRow(7).commit();

    var row8 = ws.getRow(8);
    row8.height = 40;
    row8.getCell(1).value = 'Blue White Horizontal Gradient';
    row8.getCell(1).fill = utils.styles.fills.blueWhiteHGrad;
    row8.getCell(2).value = 'Red Dark Vertical';
    row8.getCell(2).fill = utils.styles.fills.redDarkVertical;
    row8.getCell(3).value = 'Red Green Dark Trellis';
    row8.getCell(3).fill = utils.styles.fills.redGreenDarkTrellis;
    row8.getCell(4).value = 'RGB Path Gradient';
    row8.getCell(4).fill = utils.styles.fills.rgbPathGrad;
    row8.commit();

    return wb;
  },

  checkTestBook: function(wb, docType, useStyles) {
    var sheetName;
    var checkFormulas, checkMerges, checkStyles, checkBadAlignments, checkSheetProperties, checkViews;
    var dateAccuracy;
    switch(docType) {
      case 'xlsx':
        sheetName = 'blort';
        checkFormulas = true;
        checkMerges = true;
        checkStyles = useStyles;
        checkBadAlignments = useStyles;
        checkSheetProperties = true;
        dateAccuracy = 3;
        checkViews = true;
        break;
      case 'model':
        sheetName = 'blort';
        checkFormulas = true;
        checkMerges = true;
        checkStyles = true;
        checkSheetProperties = true;
        checkBadAlignments = false;
        dateAccuracy = 3;
        checkViews = true;
        break;
      case 'csv':
        sheetName = 'sheet1';
        checkFormulas = false;
        checkMerges = false;
        checkStyles = false;
        checkBadAlignments = false;
        checkSheetProperties = false;
        dateAccuracy = 1000;
        checkViews = false;
        break;
    }

    expect(wb).to.not.be.undefined;

    if (checkViews) {
      expect(wb.views).to.deep.equal([{x: 1, y: 2, width: 10000, height: 20000, firstSheet: 0, activeTab: 0, visibility: 'visible'}]);
    }
    
    var ws = wb.getWorksheet(sheetName);
    expect(ws).to.not.be.undefined;

    if (checkSheetProperties) {
      expect(ws.getColumn(10).outlineLevel).to.equal(1);
      expect(ws.getColumn(10).collapsed).to.equal(true);
      expect(ws.getRow(10).outlineLevel).to.equal(1);
      expect(ws.getRow(10).collapsed).to.equal(true);
      expect(ws.properties.outlineLevelCol).to.equal(1);
      expect(ws.properties.outlineLevelRow).to.equal(1);
      expect(ws.properties.tabColor).to.deep.equal({argb:'FF00FF00'});
      expect(ws.properties).to.deep.equal(utils.properties);
      expect(ws.pageSetup).to.deep.equal(utils.pageSetup);
    }
    
    expect(ws.getCell('A1').value).to.equal(7);
    expect(ws.getCell('A1').type).to.equal(Excel.ValueType.Number);
    expect(ws.getCell('B1').value).to.equal(utils.testValues.str);
    expect(ws.getCell('B1').type).to.equal(Excel.ValueType.String);
    expect(Math.abs(ws.getCell('C1').value.getTime() - utils.testValues.date.getTime())).to.be.below(dateAccuracy);
    expect(ws.getCell('C1').type).to.equal(Excel.ValueType.Date);

    if (checkFormulas) {
      expect(ws.getCell('D1').value).to.deep.equal(utils.testValues.formulas[0]);
      expect(ws.getCell('D1').type).to.equal(Excel.ValueType.Formula);
      expect(ws.getCell('E1').value.formula).to.equal(utils.testValues.formulas[1].formula);
      expect(ws.getCell('E1').value.value).to.be.undefined;
      expect(ws.getCell('E1').type).to.equal(Excel.ValueType.Formula);
      expect(ws.getCell('F1').value).to.deep.equal(utils.testValues.hyperlink);
      expect(ws.getCell('F1').type).to.equal(Excel.ValueType.Hyperlink);
      expect(ws.getCell('G1').value).to.equal(utils.testValues.str2);
    } else {
      expect(ws.getCell('D1').value).to.equal(utils.testValues.formulas[0].result);
      expect(ws.getCell('D1').type).to.equal(Excel.ValueType.Number);
      expect(ws.getCell('E1').value).to.be.null;
      expect(ws.getCell('E1').type).to.equal(Excel.ValueType.Null);
      expect(ws.getCell('F1').value).to.deep.equal(utils.testValues.hyperlink.hyperlink);
      expect(ws.getCell('F1').type).to.equal(Excel.ValueType.String);
      expect(ws.getCell('G1').value).to.equal(utils.testValues.str2);
    }

    // A2:B3
    expect(ws.getCell('A2').value).to.equal(5);
    expect(ws.getCell('A2').type).to.equal(Excel.ValueType.Number);
    expect(ws.getCell('A2').master).to.equal(ws.getCell('A2'));

    if (checkMerges) {
      expect(ws.getCell('A3').value).to.equal(5);
      expect(ws.getCell('A3').type).to.equal(Excel.ValueType.Merge);
      expect(ws.getCell('A3').master).to.equal(ws.getCell('A2'));

      expect(ws.getCell('B2').value).to.equal(5);
      expect(ws.getCell('B2').type).to.equal(Excel.ValueType.Merge);
      expect(ws.getCell('B2').master).to.equal(ws.getCell('A2'));

      expect(ws.getCell('B3').value).to.equal(5);
      expect(ws.getCell('B3').type).to.equal(Excel.ValueType.Merge);
      expect(ws.getCell('B3').master).to.equal(ws.getCell('A2'));

      // C2:D3
      expect(ws.getCell('C2').value).to.be.null;
      expect(ws.getCell('C2').type).to.equal(Excel.ValueType.Null);
      expect(ws.getCell('C2').master).to.equal(ws.getCell('C2'));

      expect(ws.getCell('D2').value).to.be.null;
      expect(ws.getCell('D2').type).to.equal(Excel.ValueType.Merge);
      expect(ws.getCell('D2').master).to.equal(ws.getCell('C2'));

      expect(ws.getCell('C3').value).to.be.null;
      expect(ws.getCell('C3').type).to.equal(Excel.ValueType.Merge);
      expect(ws.getCell('C3').master).to.equal(ws.getCell('C2'));

      expect(ws.getCell('D3').value).to.be.null;
      expect(ws.getCell('D3').type).to.equal(Excel.ValueType.Merge);
      expect(ws.getCell('D3').master).to.equal(ws.getCell('C2'));
    }

    if (checkStyles) {
      expect(ws.getCell('A4').numFmt).to.equal(utils.testValues.numFmt1);
      expect(ws.getCell('A4').type).to.equal(Excel.ValueType.Number);
      expect(ws.getCell('A4').border).to.deep.equal(utils.styles.borders.thin);
      expect(ws.getCell('C4').numFmt).to.equal(utils.testValues.numFmt2);
      expect(ws.getCell('C4').type).to.equal(Excel.ValueType.Number);
      expect(ws.getCell('C4').border).to.deep.equal(utils.styles.borders.doubleRed);
      expect(ws.getCell('E4').border).to.deep.equal(utils.styles.borders.thickRainbow);

      // test fonts and formats
      expect(ws.getCell('A5').value).to.equal(utils.testValues.str);
      expect(ws.getCell('A5').type).to.equal(Excel.ValueType.String);
      expect(ws.getCell('A5').font).to.deep.equal(utils.styles.fonts.arialBlackUI14);
      expect(ws.getCell('B5').value).to.equal(utils.testValues.str);
      expect(ws.getCell('B5').type).to.equal(Excel.ValueType.String);
      expect(ws.getCell('B5').font).to.deep.equal(utils.styles.fonts.broadwayRedOutline20);
      expect(ws.getCell('C5').value).to.equal(utils.testValues.str);
      expect(ws.getCell('C5').type).to.equal(Excel.ValueType.String);
      expect(ws.getCell('C5').font).to.deep.equal(utils.styles.fonts.comicSansUdB16);

      expect(Math.abs(ws.getCell('D5').value - 1.6)).to.be.below(0.00000001);
      expect(ws.getCell('D5').type).to.equal(Excel.ValueType.Number);
      expect(ws.getCell('D5').numFmt).to.equal(utils.testValues.numFmt1);
      expect(ws.getCell('D5').font).to.deep.equal(utils.styles.fonts.arialBlackUI14);

      expect(Math.abs(ws.getCell('E5').value - 1.6)).to.be.below(0.00000001);
      expect(ws.getCell('E5').type).to.equal(Excel.ValueType.Number);
      expect(ws.getCell('E5').numFmt).to.equal(utils.testValues.numFmt2);
      expect(ws.getCell('E5').font).to.deep.equal(utils.styles.fonts.broadwayRedOutline20);

      expect(Math.abs(ws.getCell('F5').value.getTime() - utils.testValues.date.getTime())).to.be.below(dateAccuracy);
      expect(ws.getCell('F5').type).to.equal(Excel.ValueType.Date);
      expect(ws.getCell('F5').numFmt).to.equal(utils.testValues.numFmtDate);
      expect(ws.getCell('F5').font).to.deep.equal(utils.styles.fonts.comicSansUdB16);

      expect(ws.getRow(5).height).to.be.undefined;
      expect(ws.getRow(6).height).to.equal(42);
      _.each(utils.styles.alignments, function(alignment, index) {
        var rowNumber = 6;
        var colNumber = index + 1;
        var cell = ws.getCell(rowNumber, colNumber);
        expect(cell.value).to.equal(alignment.text);
        expect(cell.alignment).to.deep.equal(alignment.alignment);
      });

      if (checkBadAlignments) {
        _.each(utils.styles.badAlignments, function(alignment, index) {
          var rowNumber = 7;
          var colNumber = index + 1;
          var cell = ws.getCell(rowNumber, colNumber);
          expect(cell.value).to.equal(alignment.text);
          expect(cell.alignment).to.be.undefined;
        });
      }

      var row8 = ws.getRow(8);
      expect(row8.height).to.equal(40);
      expect(row8.getCell(1).fill).to.deep.equal(utils.styles.fills.blueWhiteHGrad);
      expect(row8.getCell(2).fill).to.deep.equal(utils.styles.fills.redDarkVertical);
      expect(row8.getCell(3).fill).to.deep.equal(utils.styles.fills.redGreenDarkTrellis);
      expect(row8.getCell(4).fill).to.deep.equal(utils.styles.fills.rgbPathGrad);
    }
  },

  checkTestBookReader: function(filename) {
    var wb = new Excel.stream.xlsx.WorkbookReader();

    // expectations
    var dateAccuracy = 3;

    var deferred = Bluebird.defer();

    wb.on('worksheet', function(ws) {
      // Sheet name stored in workbook. Not guaranteed here
      // expect(ws.name).to.equal('blort');
      ws.on('row', function(row) {
        switch(row.number) {
          case 1:
            expect(row.getCell('A').value).to.equal(7);
            expect(row.getCell('A').type).to.equal(Excel.ValueType.Number);
            expect(row.getCell('B').value).to.equal(utils.testValues.str);
            expect(row.getCell('B').type).to.equal(Excel.ValueType.String);
            expect(Math.abs(row.getCell('C').value.getTime() - utils.testValues.date.getTime())).to.be.below(dateAccuracy);
            expect(row.getCell('C').type).to.equal(Excel.ValueType.Date);

            expect(row.getCell('D').value).to.deep.equal(utils.testValues.formulas[0]);
            expect(row.getCell('D').type).to.equal(Excel.ValueType.Formula);
            expect(row.getCell('E').value).to.deep.equal(utils.testValues.formulas[1]);
            expect(row.getCell('E').type).to.equal(Excel.ValueType.Formula);
            expect(row.getCell('F').value).to.deep.equal(utils.testValues.hyperlink);
            expect(row.getCell('F').type).to.equal(Excel.ValueType.Hyperlink);
            expect(row.getCell('G').value).to.equal(utils.testValues.str2);
            break;

          case 2:
            // A2:B3
            expect(row.getCell('A').value).to.equal(5);
            expect(row.getCell('A').type).to.equal(Excel.ValueType.Number);
            //expect(row.getCell('A').master).to.equal(ws.getCell('A2'));

            expect(row.getCell('B').value).to.equal(5);
            expect(row.getCell('B').type).to.equal(Excel.ValueType.Merge);
            //expect(row.getCell('B').master).to.equal(ws.getCell('A2'));

            // C2:D3
            expect(row.getCell('C').value).to.be.null;
            expect(row.getCell('C').type).to.equal(Excel.ValueType.Null);
            //expect(row.getCell('C').master).to.equal(ws.getCell('C2'));

            expect(row.getCell('D').value).to.be.null;
            expect(row.getCell('D').type).to.equal(Excel.ValueType.Merge);
            //expect(row.getCell('D').master).to.equal(ws.getCell('C2'));

            break;

          case 3:
            expect(row.getCell('A').value).to.equal(5);
            expect(row.getCell('A').type).to.equal(Excel.ValueType.Merge);
            //expect(row.getCell('A').master).to.equal(ws.getCell('A2'));

            expect(row.getCell('B').value).to.equal(5);
            expect(row.getCell('B').type).to.equal(Excel.ValueType.Merge);
            //expect(row.getCell('B').master).to.equal(ws.getCell('A2'));

            expect(row.getCell('C').value).to.be.null;
            expect(row.getCell('C').type).to.equal(Excel.ValueType.Merge);
            //expect(row.getCell('C').master).to.equal(ws.getCell('C2'));

            expect(row.getCell('D').value).to.be.null;
            expect(row.getCell('D').type).to.equal(Excel.ValueType.Merge);
            //expect(row.getCell('D').master).to.equal(ws.getCell('C2'));
            break;

          case 4:
            expect(row.getCell('A').numFmt).to.equal(utils.testValues.numFmt1);
            expect(row.getCell('A').type).to.equal(Excel.ValueType.Number);
            expect(row.getCell('A').border).to.deep.equal(utils.styles.borders.thin);
            expect(row.getCell('C').numFmt).to.equal(utils.testValues.numFmt2);
            expect(row.getCell('C').type).to.equal(Excel.ValueType.Number);
            expect(row.getCell('C').border).to.deep.equal(utils.styles.borders.doubleRed);
            expect(row.getCell('E').border).to.deep.equal(utils.styles.borders.thickRainbow);
            break;

          case 5:
            // test fonts and formats
            expect(row.getCell('A').value).to.equal(utils.testValues.str);
            expect(row.getCell('A').type).to.equal(Excel.ValueType.String);
            expect(row.getCell('A').font).to.deep.equal(utils.styles.fonts.arialBlackUI14);
            expect(row.getCell('B').value).to.equal(utils.testValues.str);
            expect(row.getCell('B').type).to.equal(Excel.ValueType.String);
            expect(row.getCell('B').font).to.deep.equal(utils.styles.fonts.broadwayRedOutline20);
            expect(row.getCell('C').value).to.equal(utils.testValues.str);
            expect(row.getCell('C').type).to.equal(Excel.ValueType.String);
            expect(row.getCell('C').font).to.deep.equal(utils.styles.fonts.comicSansUdB16);

            expect(Math.abs(row.getCell('D').value - 1.6)).to.be.below(0.00000001);
            expect(row.getCell('D').type).to.equal(Excel.ValueType.Number);
            expect(row.getCell('D').numFmt).to.equal(utils.testValues.numFmt1);
            expect(row.getCell('D').font).to.deep.equal(utils.styles.fonts.arialBlackUI14);

            expect(Math.abs(row.getCell('E').value - 1.6)).to.be.below(0.00000001);
            expect(row.getCell('E').type).to.equal(Excel.ValueType.Number);
            expect(row.getCell('E').numFmt).to.equal(utils.testValues.numFmt2);
            expect(row.getCell('E').font).to.deep.equal(utils.styles.fonts.broadwayRedOutline20);

            expect(Math.abs(ws.getCell('F5').value.getTime() - utils.testValues.date.getTime())).to.be.below(dateAccuracy);
            expect(ws.getCell('F5').type).to.equal(Excel.ValueType.Date);
            expect(ws.getCell('F5').numFmt).to.equal(utils.testValues.numFmtDate);
            expect(ws.getCell('F5').font).to.deep.equal(utils.styles.fonts.comicSansUdB16);
            expect(row.height).to.be.undefined;
            break;

          case 6:
            expect(ws.getRow(6).height).to.equal(42);
            _.each(utils.styles.alignments, function(alignment, index) {
              var colNumber = index + 1;
              var cell = row.getCell(colNumber);
              expect(cell.value).to.equal(alignment.text);
              expect(cell.alignment).to.deep.equal(alignment.alignment);
            });
            break;

          case 7:
            _.each(utils.styles.badAlignments, function(alignment, index) {
              var colNumber = index + 1;
              var cell = row.getCell(colNumber);
              expect(cell.value).to.equal(alignment.text);
              expect(cell.alignment).to.be.undefined;
            });
            break;

          case 8:
            expect(row.height).to.equal(40);
            expect(row.getCell(1).fill).to.deep.equal(utils.styles.fills.blueWhiteHGrad);
            expect(row.getCell(2).fill).to.deep.equal(utils.styles.fills.redDarkVertical);
            expect(row.getCell(3).fill).to.deep.equal(utils.styles.fills.redGreenDarkTrellis);
            expect(row.getCell(4).fill).to.deep.equal(utils.styles.fills.rgbPathGrad);
            break;
        }
      });
    });
    wb.on('end', function() {
      deferred.resolve();
    });

    wb.read(filename, {entries: 'emit', worksheets: 'emit'});

    return deferred.promise;
  },
  
  createSheetMock: function() {
    return {
      _keys: {},
      _cells: {},
      rows: [],
      columns: [],
      properties: {
        outlineLevelCol: 0,
        outlineLevelRow: 0
      },
      
      addColumn: function(colNumber, defn) {
        return this.columns[colNumber-1] = new Column(this, colNumber, defn);
      },
      getColumn: function(colNumber) {
        var column = this.columns[colNumber-1] || this._keys[colNumber];
        if (!column) {
          column = this.columns[colNumber-1] = new Column(this, colNumber);
        }
        return column;
      },
      getRow: function(rowNumber) {
        var row = this.rows[rowNumber-1];
        if (!row) {
          row = this.rows[rowNumber-1] = new Row(this, rowNumber);
        }
        return row;
      },
      getCell: function(rowNumber, colNumber) {
        return this.getRow(rowNumber).getCell(colNumber);
      }
    };
  }

};