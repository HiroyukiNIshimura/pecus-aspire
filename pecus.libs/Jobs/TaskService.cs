using pecus.Libs.Interfaces;
using pecus.Libs.Models;
using System.Linq.Expressions;

namespace pecus.Libs.Jobs
{
    public class TaskService : ITaskService
    {
        public Task<List<TaskModel>> Find(Expression<Func<TaskModel, bool>> filter) => throw new NotImplementedException();
        public Task<TaskModel> RegisterTask(string taskName) => throw new NotImplementedException();
        public Task<long> Update(string objectId, TaskModel newOne) => throw new NotImplementedException();
    }
}
