const fillTemplate = require('./utils/fillTemplate');

(async () => {
  const output = await fillTemplate(
    '1746849076569-Name.pdf', // the file you uploaded
    'TestStudent_Course1.pdf',
    {
      studentName: 'John Doe',
      studentId: 'STU123',
      courseTitle: 'GWO Working at Heights',
      instructorName: 'Jane Instructor',
      classDate: '2024-05-10'
    }
  );

  console.log('✅ PDF generated at:', output);
})();
